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

const returnService = {
    // Create return as draft and automatically reverse stock for on-shelf items
    createReturn: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { orderId, note, returnDate, items } = req.body;
            const returnTime = returnDate ? new Date(returnDate) : new Date();

            let newReturn;
            let stockMovements = [];
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

                // CHANGED: Auto-reverse stock for on-shelf items immediately upon return creation
                for (const item of returnItems) {
                    if (item.itemType === ORDER_TYPE.ON_SHELF) {
                        // Reverse reserved stock back to theoretical stock
                        const r = await productRepository.unreserveOrderItem(
                            {
                                productId: item.productId,
                                actualQuantity: item.actualQuantity,
                            },
                            tx,
                        );

                        if (r.modifiedCount !== 1) {
                            throw createError(
                                `Cannot reverse stock for product ${item.productId} (reserved mismatch)`,
                                409,
                            );
                        }

                        // Create stock movement record for the reversal
                        const sm = await stockMovementRepository.createStockMovement(
                            {
                                productId: item.productId,
                                quantityChange: item.actualQuantity,
                                from: STOCK_MOVEMENT_TYPE.RESERVE,
                                to: STOCK_MOVEMENT_TYPE.INVENTORY,
                                createdByUserId: userId,
                                notes: `Return #${newReturn.returnNumber}: Stock reversed from reserved to inventory`,
                                returnId: newReturn._id,
                                isExecuted: true,
                            },
                            tx,
                        );
                        stockMovements.push(sm);
                    }
                    // ON_DEMAND items: no stock reversal (they never had reserved stock)
                }
            });

            return res.status(201).json(
                response("Return created successfully and stock reversed", {
                    newReturn,
                    stockMovements,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // Get all returns
    getAllReturns: async (req, res, next) => {
        try {
            const returns = await returnRepository.getAllReturns();

            res.status(200).json(response("Returns retrieved successfully", returns));
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

    // Update return while still draft (no stock changes - stock was already reversed at creation)
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
                    updateObject.items = buildReturnItemsSnapshot(requestedMap, orderItemMap);
                    // NOTE: Stock reversal already happened at creation time, no need to handle here
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
                    const maxReturnable = Number(sold.quantity) - alreadyFinalized;

                    if (item.quantity > maxReturnable) {
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
                    const skuRatio = Number(sold.actualQuantity) / Number(sold.quantity);
                    const actualQuantity = Number(item.actualQuantity) || item.quantity * skuRatio;

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
                            from: STOCK_MOVEMENT_TYPE.RETURN,
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
