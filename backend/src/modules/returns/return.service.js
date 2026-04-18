const mongoose = require("mongoose");

const returnRepository = require("./return.repository");
const orderRepository = require("../orders/order.repository");
const productRepository = require("../products/product.repository");
const stockMovementRepository = require("../stockMovements/stockMovement.repository");

const { RETURN_STATUS } = require("../../enums/return.enums");
const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../../enums/stockMovement.enums");
const { ORDER_STATUS, ORDER_TYPE } = require("../../enums/order.enums");
const { COUNTERS } = require("../../enums/counter.enums");

const response = require("../../utils/responseFactory");
const createError = require("../../utils/errorFactory");
const transactionManager = require("../../database/transactionManager/instance");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");
const { getNextDocumentNumber } = require("../../utils/helpers");
const { buildReturnInvoicePdf } = require("../../utils/invoicePdf");

// ------------ Helpers ------------

function buildOrderItemMap(order) {
    return new Map(order.items.map((it) => [String(it.productId), it]));
}

function normalizeRequestedItems(items) {
    const requestedMap = new Map(); // productIdStr -> totalQty

    for (const it of items) {
        const pid = String(it.productId);
        const qty = Number(it.quantity);

        if (!mongoose.Types.ObjectId.isValid(pid)) {
            throw createError(`Invalid productId: ${pid}`, 400);
        }
        if (!Number.isInteger(qty) || qty < 1) {
            throw createError("Each item.quantity must be an integer >= 1", 400);
        }

        requestedMap.set(pid, (requestedMap.get(pid) || 0) + qty);
    }

    return requestedMap;
}

function buildReturnItemsSnapshot(requestedMap, orderItemMap) {
    const snapshot = [];

    for (const [pid, qty] of requestedMap) {
        const sold = orderItemMap.get(pid);
        if (!sold) {
            throw createError(`Product ${pid} was not sold in this order`, 409);
        }

        if (qty > Number(sold.lineQuantity)) {
            throw createError(
                `Cannot set return qty ${qty} for product ${pid}. Sold quantity: ${sold.lineQuantity}`,
                409,
            );
        }

        // Calculate actualQuantity based on the ratio from order (actualQuantity / lineQuantity)
        const skuRatio = Number(sold.actualQuantity) / Number(sold.lineQuantity);
        const actualQuantity = qty * skuRatio;
        const totalPrice = actualQuantity * sold.unitPrice;

        snapshot.push({
            productId: sold.productId,
            lineQuantity: qty,
            actualQuantity,
            unitPrice: sold.unitPrice,
            totalPrice,
            itemType: sold.itemType, // CHANGED: include itemType from original order item
        });
    }

    return snapshot;
}

async function validateRequestedItemsWithinSoldLimits(data, tx) {
    const { orderId, returnId = null, requestedMap, orderItemMap } = data;

    const returnedAgg = await returnRepository.getReturnedByOrderExcludingReturn(
        {
            orderId,
            returnId,
            statuses: [RETURN_STATUS.DRAFT, RETURN_STATUS.FINALIZED],
        },
        tx,
    );

    const alreadyReturnedMap = new Map(
        returnedAgg.map((r) => [String(r._id), Number(r.returnedQty)]),
    );

    for (const [pid, qty] of requestedMap) {
        const sold = orderItemMap.get(pid);
        if (!sold) {
            throw createError(`Product ${pid} was not sold in this order`, 409);
        }

        const soldQty = Number(sold.lineQuantity);
        const alreadyReturned = alreadyReturnedMap.get(pid) || 0;
        const remaining = soldQty - alreadyReturned;

        if (qty > remaining) {
            throw createError(
                `Cannot set return qty ${qty} for product ${pid}. Remaining returnable quantity: ${Math.max(remaining, 0)}`,
                409,
            );
        }
    }
}

const returnService = {
    // Create return as draft (no stock changes at draft stage)
    createReturn: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { orderId, note, returnDate, items } = req.body;
            const returnTime = returnDate ? new Date(returnDate) : new Date();

            let newReturn;
            await transactionManager.run(async (tx) => {
                const session = getMongoSession(tx);
                // 1) Load & validate order
                const order = await orderRepository.getOrderById(orderId, tx);
                if (!order) throw createError("Order not found", 404);
                if (order.status !== ORDER_STATUS.FINALIZED) {
                    throw createError("Order is not finalized", 409);
                }

                // 2) Build return items snapshot from order at creation time
                const orderItemMap = buildOrderItemMap(order);
                const requestedMap = normalizeRequestedItems(items);

                await validateRequestedItemsWithinSoldLimits(
                    {
                        orderId,
                        requestedMap,
                        orderItemMap,
                    },
                    tx,
                );

                const returnItems = buildReturnItemsSnapshot(requestedMap, orderItemMap);

                // 3) Get next return number and create return doc
                const returnNumber = await getNextDocumentNumber(COUNTERS.RETURN_NUMBER, session);

                newReturn = await returnRepository.createReturn(
                    {
                        returnNumber,
                        orderId,
                        userId,
                        note,
                        returnDate: returnTime,
                        items: returnItems,
                    },
                    tx,
                );
            });

            return res
                .status(201)
                .json(response("Return created successfully", { newReturn, stockMovements: [] }));
        } catch (err) {
            return next(err);
        }
    },

    // Get all returns
    getAllReturns: async (req, res, next) => {
        try {
            const { customerId, status, q, page = 1, limit = 20 } = req.query;
            const pageNum = Number(page) || 1;
            const limitNum = Number(limit) || 20;
            const normalizedQuery = String(q || "")
                .trim()
                .toLowerCase();
            const numericQuery = Number(normalizedQuery);
            const hasNumericQuery =
                normalizedQuery.length > 0 &&
                !Number.isNaN(numericQuery) &&
                Number.isFinite(numericQuery);

            let returns = [];
            if (customerId) {
                const customerOrders = await orderRepository.getOrders({
                    filter: { customerId },
                });
                const orderIds = customerOrders.map((order) => order._id);

                if (orderIds.length === 0) {
                    return res.status(200).json(
                        response("Returns retrieved successfully", {
                            total: 0,
                            page: pageNum,
                            limit: limitNum,
                            pages: 0,
                            returns: [],
                        }),
                    );
                }

                returns = await returnRepository.getReturnsByOrderIds(orderIds);
            } else {
                returns = await returnRepository.getAllReturns();
            }

            const filtered = returns
                .filter((item) => {
                    if (status && item.status !== status) return false;

                    if (!normalizedQuery) return true;

                    const returnNumber = String(item.returnNumber || "").toLowerCase();
                    const orderNumber =
                        typeof item.orderId === "object" && item.orderId?.orderNumber != null
                            ? String(item.orderId.orderNumber).toLowerCase()
                            : "";
                    const note = String(item.note || "").toLowerCase();

                    let createdBy = "";
                    if (typeof item.userId === "string") {
                        createdBy = item.userId.toLowerCase();
                    } else if (item.userId) {
                        createdBy = String(
                            item.userId.name || item.userId.email || item.userId._id || "",
                        ).toLowerCase();
                    }

                    const textMatch =
                        returnNumber.includes(normalizedQuery) ||
                        orderNumber.includes(normalizedQuery) ||
                        note.includes(normalizedQuery) ||
                        createdBy.includes(normalizedQuery);

                    if (textMatch) return true;

                    if (hasNumericQuery) {
                        const returnNumberNum = Number(item.returnNumber);
                        const orderNumberNum =
                            typeof item.orderId === "object" && item.orderId?.orderNumber != null
                                ? Number(item.orderId.orderNumber)
                                : NaN;
                        return returnNumberNum === numericQuery || orderNumberNum === numericQuery;
                    }

                    return false;
                })
                .sort(
                    (a, b) => new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime(),
                );

            const total = filtered.length;
            const pages = total === 0 ? 0 : Math.ceil(total / limitNum);
            const safePage = pages === 0 ? 1 : Math.min(pageNum, pages);
            const start = (safePage - 1) * limitNum;
            const paginated = filtered.slice(start, start + limitNum);

            res.status(200).json(
                response("Returns retrieved successfully", {
                    total,
                    page: safePage,
                    limit: limitNum,
                    pages,
                    returns: paginated,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // Get returns by product ID
    getReturnsByProductId: async (req, res, next) => {
        try {
            const { productId } = req.params;

            const returns = await returnRepository.getReturnsByProductId(productId);

            res.status(200).json(response("Product returns retrieved successfully", returns));
        } catch (err) {
            return next(err);
        }
    },

    // Get returns by order ID
    getReturnsByOrderId: async (req, res, next) => {
        try {
            const { orderId } = req.params;

            const returns = await returnRepository.getReturnsByOrderId(orderId);

            res.status(200).json(response("Order returns retrieved successfully", returns));
        } catch (err) {
            return next(err);
        }
    },

    // Update return while still draft (no stock changes)
    editReturn: async (req, res, next) => {
        try {
            const returnId = req.params.returnId;
            const { items, note, returnDate } = req.body;

            let updatedReturn;
            await transactionManager.run(async (tx) => {
                // 1) Load the return
                const existingReturn = await returnRepository.getReturnById(returnId, tx);
                if (!existingReturn) throw createError("Return not found", 404);
                if (existingReturn.status !== RETURN_STATUS.DRAFT) {
                    throw createError("Cannot edit return unless it is draft", 409);
                }

                const updateObject = {};

                // 2) If items are provided, rebuild snapshot from order
                if (items !== undefined) {
                    const order = await orderRepository.getOrderById(existingReturn.orderId, tx);
                    if (!order) throw createError("Order not found", 404);
                    if (order.status !== ORDER_STATUS.FINALIZED) {
                        throw createError("Order is not finalized", 409);
                    }

                    const orderItemMap = buildOrderItemMap(order);
                    const requestedMap = normalizeRequestedItems(items);

                    await validateRequestedItemsWithinSoldLimits(
                        {
                            orderId: existingReturn.orderId,
                            returnId,
                            requestedMap,
                            orderItemMap,
                        },
                        tx,
                    );

                    updateObject.items = buildReturnItemsSnapshot(requestedMap, orderItemMap);
                }

                if (note !== undefined) updateObject.note = note;
                if (returnDate !== undefined) updateObject.returnDate = new Date(returnDate);

                if (Object.keys(updateObject).length === 0) {
                    updatedReturn = existingReturn;
                    return;
                }

                updatedReturn = await returnRepository.updateReturnById(
                    {
                        returnId,
                        updateObject,
                    },
                    tx,
                );
            });

            return res
                .status(200)
                .json(
                    response("Return updated successfully", { updatedReturn, stockMovements: [] }),
                );
        } catch (err) {
            return next(err);
        }
    },

    // Update return status - allowed transitions: draft -> finalized | cancelled
    updateReturnStatus: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const returnId = req.params.returnId;
            const { status } = req.body;

            let result;
            await transactionManager.run(async (tx) => {
                const returnDoc = await returnRepository.getReturnById(returnId, tx);
                if (!returnDoc) throw createError("Return not found", 404);

                if (returnDoc.status !== RETURN_STATUS.DRAFT) {
                    throw createError("Only draft returns can change status", 409);
                }

                if (status === RETURN_STATUS.CANCELLED) {
                    const updatedReturn = await returnRepository.updateReturnById(
                        {
                            returnId,
                            updateObject: { status: RETURN_STATUS.CANCELLED },
                        },
                        tx,
                    );
                    result = { updatedReturn, stockMovements: [] };
                    return;
                }

                if (status !== RETURN_STATUS.FINALIZED) {
                    throw createError("Invalid return status transition", 400);
                }

                const order = await orderRepository.getOrderById(returnDoc.orderId, tx);
                if (!order) throw createError("Order not found", 404);
                if (order.status !== ORDER_STATUS.FINALIZED) {
                    throw createError("Order is not finalized", 409);
                }

                const orderItemMap = buildOrderItemMap(order);

                // Guard against over-returning relative to already finalized returns.
                const finalizedAgg =
                    await returnRepository.getFinalizedReturnedByOrderExcludingReturn(
                        {
                            orderId: returnDoc.orderId,
                            returnId: returnDoc._id,
                        },
                        tx,
                    );

                const finalizedReturnedMap = new Map(
                    finalizedAgg.map((r) => [String(r._id), Number(r.returnedQty)]),
                );

                for (const item of returnDoc.items) {
                    const pid = String(item.productId);
                    const sold = orderItemMap.get(pid);
                    if (!sold) {
                        throw createError(`Product ${pid} was not sold in this order`, 409);
                    }

                    const alreadyFinalized = finalizedReturnedMap.get(pid) || 0;
                    const maxReturnable = Number(sold.lineQuantity) - alreadyFinalized;

                    if (item.lineQuantity > maxReturnable) {
                        throw createError(
                            `Cannot finalize return for product ${pid}. Remaining returnable: ${maxReturnable}`,
                            409,
                        );
                    }
                }

                const movementTime = returnDoc.returnDate || new Date();
                const stockMovements = [];
                const finalizedItems = [];
                for (const item of returnDoc.items) {
                    const sold = orderItemMap.get(String(item.productId));
                    const skuRatio = Number(sold.actualQuantity) / Number(sold.lineQuantity);
                    const actualQuantity =
                        Number(item.actualQuantity) || Number(item.lineQuantity) * skuRatio;

                    if (!Number.isFinite(actualQuantity) || actualQuantity <= 0) {
                        throw createError(
                            `Invalid actual quantity for product ${item.productId}`,
                            409,
                        );
                    }

                    // Backfill missing values on old draft returns before status update.
                    const nextItem = item.toObject ? item.toObject() : { ...item };
                    nextItem.actualQuantity = actualQuantity;
                    finalizedItems.push(nextItem);

                    // Reverse stock only for on-shelf items when return is finalized.
                    if (item.itemType === ORDER_TYPE.ON_SHELF) {
                        const r = await productRepository.applyReturnFinalization(
                            {
                                productId: item.productId,
                                actualQuantity,
                            },
                            tx,
                        );

                        if (r.modifiedCount !== 1) {
                            throw createError(`Product ${item.productId} cannot be returned`, 409);
                        }

                        const stockMovement = await stockMovementRepository.createStockMovement(
                            {
                                productId: item.productId,
                                quantityChange: actualQuantity,
                                from: STOCK_MOVEMENT_TYPE.SALES,
                                to: STOCK_MOVEMENT_TYPE.INVENTORY,
                                createdByUserId: userId,
                                notes: `Return finalized for order ${returnDoc.orderId} - ${returnDoc.note || ""}`.trim(),
                                returnId: returnDoc._id,
                                warehouseAction: WAREHOUSE_ACTIONS.RECEIVE,
                            },
                            tx,
                        );

                        stockMovements.push(stockMovement);
                    }
                }

                const updatedReturn = await returnRepository.updateReturnById(
                    {
                        returnId,
                        updateObject: {
                            status: RETURN_STATUS.FINALIZED,
                            returnDate: movementTime,
                            items: finalizedItems,
                        },
                    },
                    tx,
                );

                result = { updatedReturn, stockMovements };
            });

            const { updatedReturn, stockMovements } = result;

            return res.status(200).json(
                response("Return status updated successfully", {
                    updatedReturn,
                    stockMovements,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // Download return invoice PDF
    downloadInvoice: async (req, res, next) => {
        try {
            const { returnId } = req.params;

            const returnDoc = await returnRepository.getReturnWithDetails(returnId);
            if (!returnDoc) throw createError("Return not found", 404);

            const order = await orderRepository.getOrderWithDetails(returnDoc.orderId._id);
            if (!order) throw createError("Order not found", 404);

            const invoiceBuffer = await buildReturnInvoicePdf(returnDoc, order, order.customerId);
            const fileName = `return-invoice-RET-${returnDoc.returnNumber}.pdf`;

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            return res.status(200).send(invoiceBuffer);
        } catch (err) {
            return next(err);
        }
    },

    // Delete return (draft only)
    deleteReturn: async (req, res, next) => {
        try {
            const returnId = req.params.returnId;

            let deletedReturn;
            await transactionManager.run(async (tx) => {
                // 1) Load the return
                const returnDoc = await returnRepository.getReturnById(returnId, tx);
                if (!returnDoc) {
                    throw createError("Return not found", 404);
                }

                if (returnDoc.status !== RETURN_STATUS.DRAFT) {
                    throw createError("Only draft returns can be deleted", 409);
                }

                // 2) Clean up related stock movements if any exist from legacy data.
                await stockMovementRepository.deleteByReturnId(returnDoc._id, tx);

                // 3) Delete the return itself
                await returnRepository.deleteReturnById(returnDoc._id, tx);

                deletedReturn = returnDoc;
            });

            return res.status(200).json(response("Return deleted successfully", { deletedReturn }));
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = returnService;
