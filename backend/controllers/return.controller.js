const mongoose = require("mongoose");

const Return = require("../models/return.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const StockMovement = require("../models/stockMovement.model");

const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");
const { ORDER_STATUS } = require("../enums/order.enums");
const { COUNTERS } = require("../enums/counter.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");
const { createStockMovement, getNextDocumentNumber } = require("../utils/helpers");

const returnController = {
    // Create return - creates return record and stock movement
    createReturn: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const { orderId, note, returnDate, items } = req.body;

            const movementTime = returnDate ? new Date(returnDate) : new Date();

            const { newReturn, stockMovements } = await session.withTransaction(async () => {
                // 1) Load & validate order
                const order = await Order.findById(orderId).session(session);
                if (!order) throw createError("Order not found", 404);
                if (order.status !== ORDER_STATUS.FINALIZED) {
                    throw createError("Order is not finalized", 409);
                }

                // 2) Build map of order sold items: productId -> { quantity, unitPrice }
                const orderItemMap = new Map(order.items.map((it) => [String(it.productId), it]));

                // 3) Aggregate already-returned quantities for this order (across ALL returns)
                const returnedAgg = await Return.aggregate([
                    { $match: { orderId: new mongoose.Types.ObjectId(orderId) } },
                    { $unwind: "$items" },
                    {
                        $group: {
                            _id: "$items.productId",
                            returnedQty: { $sum: "$items.quantity" },
                        },
                    },
                ]).session(session);

                const alreadyReturnedMap = new Map(
                    returnedAgg.map((r) => [String(r._id), Number(r.returnedQty)]),
                );

                // 4) Normalize request items: merge duplicates by productId
                const requestedMap = new Map(); // productIdStr -> qty
                for (const it of items) {
                    const pid = String(it.productId);
                    const qty = Number(it.quantity);

                    if (!Number.isInteger(qty) || qty < 1) {
                        throw createError("Return item quantity must be an integer >= 1", 400);
                    }

                    requestedMap.set(pid, (requestedMap.get(pid) || 0) + qty);
                }

                // 5) Build Return items snapshot with unitPrice from order + validate remaining returnable
                const returnItems = [];
                for (const [pid, qty] of requestedMap) {
                    const sold = orderItemMap.get(pid);
                    if (!sold) {
                        throw createError(`Product ${pid} was not in the order`, 409);
                    }

                    const alreadyReturned = alreadyReturnedMap.get(pid) || 0;
                    const maxReturnable = Number(sold.quantity) - alreadyReturned;

                    if (maxReturnable <= 0) {
                        throw createError(
                            `No remaining returnable quantity for product ${pid}`,
                            409,
                        );
                    }

                    if (qty > maxReturnable) {
                        throw createError(
                            `Cannot return ${qty} for product ${pid}. Remaining returnable: ${maxReturnable}`,
                            409,
                        );
                    }

                    returnItems.push({
                        productId: sold.productId, // keep ObjectId
                        quantity: qty,
                        unitPrice: sold.unitPrice, // snapshot from order
                    });
                }

                // 6) Get next return number and create return doc
                const returnNumber = await getNextDocumentNumber(COUNTERS.RETURN_NUMBER, session);

                const [newReturn] = await Return.create(
                    [
                        {
                            returnNumber,
                            orderId,
                            userId,
                            note,
                            returnDate: movementTime,
                            items: returnItems,
                        },
                    ],
                    { session },
                );

                // 7) Create movements + update product totals
                const stockMovements = [];
                for (const item of returnItems) {
                    const sm = await createStockMovement(
                        {
                            productId: item.productId,
                            returnId: newReturn._id,
                            quantityChange: item.quantity,
                            movementType: STOCK_MOVEMENT_TYPE.RETURN,
                            movementTime,
                            notes: `Return from order ${orderId} - ${note || ""}`.trim(),
                            userId,
                        },
                        session,
                    );
                    stockMovements.push(sm);

                    // Reverse sale effect: sold-- and theoretical++
                    const r = await Product.updateOne(
                        { _id: item.productId, totalSold: { $gte: item.quantity } },
                        {
                            $inc: {
                                totalSold: -item.quantity,
                                totalTheoreticalStock: +item.quantity,
                            },
                        },
                        { session },
                    );

                    if (r.modifiedCount !== 1) {
                        throw createError(`Product ${item.productId} cannot be returned`, 409);
                    }
                }

                return { newReturn, stockMovements };
            });

            return res
                .status(201)
                .json(response("Return created successfully", { newReturn, stockMovements }));
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

    // Update return - updates return record and creates new stock movements
    editReturn: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const returnId = req.params.returnId;
            const { items, note, returnDate } = req.body;

            const movementTime = returnDate ? new Date(returnDate) : new Date();

            const { updatedReturn, stockMovements } = await session.withTransaction(async () => {
                // 1) Load the return
                const existingReturn = await Return.findById(returnId).session(session);
                if (!existingReturn) throw createError("Return not found", 404);

                const orderId = existingReturn.orderId;

                // 2) Load the order (source of unitPrice snapshot)
                const order = await Order.findById(orderId).session(session);
                if (!order) throw createError("Order not found", 404);
                if (order.status !== ORDER_STATUS.FINALIZED) {
                    throw createError("Order is not finalized", 409);
                }

                // 3) Build order map (productId -> { quantity, unitPrice })
                const orderItemMap = new Map(order.items.map((it) => [String(it.productId), it]));

                // 4) Aggregate already-returned quantities for this order EXCLUDING this return
                const returnedAgg = await Return.aggregate([
                    {
                        $match: {
                            orderId: new mongoose.Types.ObjectId(orderId),
                            _id: { $ne: new mongoose.Types.ObjectId(returnId) },
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

                const alreadyReturnedByOthers = new Map(
                    returnedAgg.map((r) => [String(r._id), Number(r.returnedQty)]),
                );

                // 5) Normalize incoming items (merge duplicates by productId)
                const requestedMap = new Map(); // pidStr -> qty
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

                // 6) Build new snapshot items + enforce multi-return rule
                const newItemsSnapshot = [];
                for (const [pid, qty] of requestedMap) {
                    const sold = orderItemMap.get(pid);
                    if (!sold) {
                        throw createError(`Product ${pid} was not sold in this order`, 409);
                    }

                    const otherReturned = alreadyReturnedByOthers.get(pid) || 0;
                    const maxReturnable = Number(sold.quantity) - otherReturned;

                    if (maxReturnable <= 0) {
                        throw createError(
                            `No remaining returnable quantity for product ${pid}`,
                            409,
                        );
                    }
                    if (qty > maxReturnable) {
                        throw createError(
                            `Cannot set return qty ${qty} for product ${pid}. Remaining returnable: ${maxReturnable}`,
                            409,
                        );
                    }

                    newItemsSnapshot.push({
                        productId: sold.productId, // keep ObjectId
                        quantity: qty,
                        unitPrice: sold.unitPrice, // snapshot from order
                    });
                }

                // 7) Rollback old stock effects (undo this return’s previous impact)
                for (const oldItem of existingReturn.items) {
                    const r = await Product.updateOne(
                        {
                            _id: oldItem.productId,
                            totalTheoreticalStock: { $gte: oldItem.quantity }, // prevent negative
                        },
                        {
                            $inc: {
                                totalSold: +oldItem.quantity,
                                totalTheoreticalStock: -oldItem.quantity,
                            },
                        },
                        { session },
                    );

                    if (r.modifiedCount !== 1) {
                        throw createError(
                            `Cannot rollback previous return for product ${oldItem.productId} (stock mismatch)`,
                            409,
                        );
                    }
                }

                // 8) Delete all old stock movements for this return
                await StockMovement.deleteMany({ returnId: existingReturn._id }, { session });

                // 9) Apply new stock effects + recreate movements
                const stockMovements = [];
                for (const item of newItemsSnapshot) {
                    const r = await Product.updateOne(
                        {
                            _id: item.productId,
                            totalSold: { $gte: item.quantity }, // can’t return more than sold globally
                        },
                        {
                            $inc: {
                                totalSold: -item.quantity,
                                totalTheoreticalStock: +item.quantity,
                            },
                        },
                        { session },
                    );

                    if (r.modifiedCount !== 1) {
                        throw createError(`Product ${item.productId} cannot be returned`, 409);
                    }

                    const sm = await createStockMovement(
                        {
                            productId: item.productId,
                            returnId: existingReturn._id,
                            quantityChange: item.quantity,
                            movementType: STOCK_MOVEMENT_TYPE.RETURN,
                            movementTime,
                            notes: `Return edited for order ${orderId} - ${note || existingReturn.note || ""}`.trim(),
                            userId,
                        },
                        session,
                    );

                    stockMovements.push(sm);
                }

                // 10) Update the return document
                existingReturn.items = newItemsSnapshot;
                if (note !== undefined) existingReturn.note = note;
                if (returnDate !== undefined) existingReturn.returnDate = movementTime;

                await existingReturn.save({ session });

                return { updatedReturn: existingReturn, stockMovements };
            });

            return res
                .status(200)
                .json(response("Return updated successfully", { updatedReturn, stockMovements }));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // Delete return - deletes return and associated stock movements
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

                // 2) Undo stock effects (reverse what createReturn did)
                for (const item of returnDoc.items) {
                    const r = await Product.updateOne(
                        {
                            _id: item.productId,
                            totalTheoreticalStock: { $gte: item.quantity }, // prevent negative
                        },
                        {
                            $inc: {
                                totalSold: +item.quantity,
                                totalTheoreticalStock: -item.quantity,
                            },
                        },
                        { session },
                    );

                    if (r.modifiedCount !== 1) {
                        throw createError(
                            `Cannot undo return for product ${item.productId} (stock mismatch)`,
                            409,
                        );
                    }
                }

                // 3) Delete all stock movements for this return
                await StockMovement.deleteMany({ returnId: returnDoc._id }, { session });

                // 4) Delete the return itself
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
