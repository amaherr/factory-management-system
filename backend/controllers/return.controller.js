const mongoose = require("mongoose");

const Return = require("../models/return.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const StockMovement = require("../models/stockMovement.model");

const { RETURN_STATUS } = require("../enums/return.enums");
const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../enums/stockMovement.enums");
const { ORDER_STATUS } = require("../enums/order.enums");
const { COUNTERS } = require("../enums/counter.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");
const { createStockMovement, getNextDocumentNumber } = require("../utils/helpers");

/////// Helpers ///////

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

        if (qty > Number(sold.quantity)) {
            throw createError(
                `Cannot set return qty ${qty} for product ${pid}. Sold quantity: ${sold.quantity}`,
                409,
            );
        }

        // Calculate actualQuantity based on the ratio from order (actualQuantity / quantity)
        const skuRatio = Number(sold.actualQuantity) / Number(sold.quantity);
        const actualQuantity = qty * skuRatio;

        snapshot.push({
            productId: sold.productId,
            quantity: qty,
            actualQuantity,
            unitPrice: sold.unitPrice,
        });
    }

    return snapshot;
}

const returnController = {
    // Create return as draft (no stock changes)
    createReturn: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const { orderId, note, returnDate, items } = req.body;
            const returnTime = returnDate ? new Date(returnDate) : new Date();

            const newReturn = await session.withTransaction(async () => {
                // 1) Load & validate order
                const order = await Order.findById(orderId).session(session);
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

                const [newReturn] = await Return.create(
                    [
                        {
                            returnNumber,
                            orderId,
                            userId,
                            note,
                            returnDate: returnTime,
                            items: returnItems,
                        },
                    ],
                    { session },
                );

                return newReturn;
            });

            return res.status(201).json(response("Return created successfully", newReturn));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // Get all returns
    getAllReturns: async (req, res, next) => {
        try {
            const returns = await Return.find()
                .populate("orderId")
                .populate("userId")
                .populate("items.productId");

            res.status(200).json(response("Returns retrieved successfully", returns));
        } catch (err) {
            return next(err);
        }
    },

    // Get returns by product ID
    getReturnsByProductId: async (req, res, next) => {
        try {
            const { productId } = req.params;

            const returns = await Return.find({
                "items.productId": productId,
            })
                .populate("orderId")
                .populate("userId")
                .populate("items.productId");

            res.status(200).json(response("Product returns retrieved successfully", returns));
        } catch (err) {
            return next(err);
        }
    },

    // Get returns by order ID
    getReturnsByOrderId: async (req, res, next) => {
        try {
            const { orderId } = req.params;

            const returns = await Return.find({ orderId })
                .populate("orderId")
                .populate("userId")
                .populate("items.productId");

            res.status(200).json(response("Order returns retrieved successfully", returns));
        } catch (err) {
            return next(err);
        }
    },

    // Update return while still draft (no stock changes)
    editReturn: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const returnId = req.params.returnId;
            const { items, note, returnDate } = req.body;

            const updatedReturn = await session.withTransaction(async () => {
                // 1) Load the return
                const existingReturn = await Return.findById(returnId).session(session);
                if (!existingReturn) throw createError("Return not found", 404);
                if (existingReturn.status !== RETURN_STATUS.DRAFT) {
                    throw createError("Cannot edit return unless it is draft", 409);
                }

                // 2) If items are provided, rebuild snapshot from order
                if (items !== undefined) {
                    const order = await Order.findById(existingReturn.orderId).session(session);
                    if (!order) throw createError("Order not found", 404);
                    if (order.status !== ORDER_STATUS.FINALIZED) {
                        throw createError("Order is not finalized", 409);
                    }

                    const orderItemMap = buildOrderItemMap(order);
                    const requestedMap = normalizeRequestedItems(items);
                    existingReturn.items = buildReturnItemsSnapshot(requestedMap, orderItemMap);
                }

                if (note !== undefined) existingReturn.note = note;
                if (returnDate !== undefined) existingReturn.returnDate = new Date(returnDate);

                await existingReturn.save({ session });

                return existingReturn;
            });

            return res
                .status(200)
                .json(
                    response("Return updated successfully", { updatedReturn, stockMovements: [] }),
                );
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // Update return status - allowed transitions: draft -> finalized | cancelled
    updateReturnStatus: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const returnId = req.params.returnId;
            const { status } = req.body;

            const { updatedReturn, stockMovements } = await session.withTransaction(async () => {
                const returnDoc = await Return.findById(returnId).session(session);
                if (!returnDoc) throw createError("Return not found", 404);

                if (returnDoc.status !== RETURN_STATUS.DRAFT) {
                    throw createError("Only draft returns can change status", 409);
                }

                if (status === RETURN_STATUS.CANCELLED) {
                    returnDoc.status = RETURN_STATUS.CANCELLED;
                    await returnDoc.save({ session });
                    return { updatedReturn: returnDoc, stockMovements: [] };
                }

                if (status !== RETURN_STATUS.FINALIZED) {
                    throw createError("Invalid return status transition", 400);
                }

                const order = await Order.findById(returnDoc.orderId).session(session);
                if (!order) throw createError("Order not found", 404);
                if (order.status !== ORDER_STATUS.FINALIZED) {
                    throw createError("Order is not finalized", 409);
                }

                const orderItemMap = buildOrderItemMap(order);

                // Guard against over-returning relative to already finalized returns.
                const finalizedAgg = await Return.aggregate([
                    {
                        $match: {
                            orderId: new mongoose.Types.ObjectId(returnDoc.orderId),
                            status: RETURN_STATUS.FINALIZED,
                            _id: { $ne: new mongoose.Types.ObjectId(returnDoc._id) },
                        },
                    },
                    { $unwind: "$items" },
                    {
                        $group: {
                            _id: "$items.productId",
                            returnedQty: { $sum: "$items.quantity" },
                        },
                    },
                ]).session(session);

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
                for (const item of returnDoc.items) {
                    const r = await Product.updateOne(
                        { _id: item.productId, totalSold: { $gte: item.actualQuantity } },
                        {
                            $inc: {
                                totalSold: -item.actualQuantity,
                                totalTheoreticalStock: +item.actualQuantity,
                            },
                        },
                        { session },
                    );

                    if (r.modifiedCount !== 1) {
                        throw createError(`Product ${item.productId} cannot be returned`, 409);
                    }

                    const stockMovement = await createStockMovement(
                        {
                            productId: item.productId,
                            quantityChange: item.actualQuantity,
                            from: STOCK_MOVEMENT_TYPE.RETURN,
                            to: STOCK_MOVEMENT_TYPE.INVENTORY,
                            createdByUserId: userId,
                            notes: `Return finalized for order ${returnDoc.orderId} - ${returnDoc.note || ""}`.trim(),
                            returnId: returnDoc._id,
                            warehouseAction: WAREHOUSE_ACTIONS.RECEIVE,
                        },
                        session,
                    );

                    stockMovements.push(stockMovement);
                }

                returnDoc.status = RETURN_STATUS.FINALIZED;
                returnDoc.returnDate = movementTime;
                await returnDoc.save({ session });

                return { updatedReturn: returnDoc, stockMovements };
            });

            return res.status(200).json(
                response("Return status updated successfully", {
                    updatedReturn,
                    stockMovements,
                }),
            );
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // Delete return (draft only)
    deleteReturn: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const returnId = req.params.returnId;

            const deletedReturn = await session.withTransaction(async () => {
                // 1) Load the return
                const returnDoc = await Return.findById(returnId).session(session);
                if (!returnDoc) {
                    throw createError("Return not found", 404);
                }

                if (returnDoc.status !== RETURN_STATUS.DRAFT) {
                    throw createError("Only draft returns can be deleted", 409);
                }

                // 2) Clean up related stock movements if any exist from legacy data.
                await StockMovement.deleteMany({ returnId: returnDoc._id }, { session });

                // 3) Delete the return itself
                await Return.deleteOne({ _id: returnDoc._id }, { session });

                return returnDoc;
            });

            return res.status(200).json(response("Return deleted successfully", { deletedReturn }));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },
};

module.exports = returnController;
