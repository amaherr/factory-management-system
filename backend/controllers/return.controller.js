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
            const { orderId, note, returnDate, items } = req.body;

            if (!items || items.length === 0) {
                return next(createError("Return must have at least one item", 400));
            }

            const { newReturn, stockMovements } = await session.withTransaction(async () => {
                // Check order status
                const order = await Order.findById(orderId).session(session);
                if (!order) {
                    throw createError("Order not found", 404);
                }
                if (order.status !== ORDER_STATUS.FINALIZED) {
                    throw createError("Order is not finalized", 409);
                }

                // Get next return number
                const returnNumber = await getNextDocumentNumber(COUNTERS.RETURN_NUMBER, session);

                // Create the return
                const [newReturn] = await Return.create(
                    [
                        {
                            returnNumber,
                            orderId,
                            userId: req.user.id,
                            note,
                            returnDate: returnDate ? new Date(returnDate) : new Date(),
                            items,
                        },
                    ],
                    { session },
                );

                // Process each item: create stock movement
                const stockMovements = [];
                for (const item of items) {
                    // Create stock movement record
                    const sm = await createStockMovement(
                        {
                            productId: item.productId,
                            returnId: newReturn._id,
                            quantityChange: item.quantity,
                            movementType: STOCK_MOVEMENT_TYPE.RETURN,
                            notes: `Return from order ${orderId} - ${note || ""}`,
                            userId: req.user.id,
                        },
                        session,
                    );

                    stockMovements.push(sm);

                    // Update product theoretical stock
                    const r = await Product.updateOne(
                        {
                            _id: item.productId,
                            totalSold: { $gte: item.quantity },
                        },
                        {
                            $inc: {
                                totalSold: -item.quantity,
                                totalTheoreticalStock: item.quantity,
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

            res.status(201).json(
                response("Return created successfully", { newReturn, stockMovements }),
            );
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
    updateReturn: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const { id } = req.params;
            const { orderId, note, returnDate, items } = req.body;

            const { existingReturn, stockMovements } = await session.withTransaction(async () => {
                // Find the existing return
                const existingReturn = await Return.findById(id).session(session);
                if (!existingReturn) {
                    throw createError("Return not found", 404);
                }

                // Step 1: Delete old stock movement records
                // Find stock movements created for this return
                await StockMovement.deleteMany(
                    {
                        returnId: existingReturn._id,
                    },
                    { session },
                );

                // Revert theoretical stock for old items
                for (const item of existingReturn.items) {
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                totalTheoreticalStock: -item.quantity,
                                totalSold: item.quantity,
                            },
                        },
                        { session },
                    );
                }

                // Step 2: Update the return document
                existingReturn.orderId = orderId || existingReturn.orderId;
                existingReturn.note = note !== undefined ? note : existingReturn.note;
                existingReturn.returnDate = returnDate || existingReturn.returnDate;
                existingReturn.items = items || existingReturn.items;

                await existingReturn.save({ session });

                // Step 3: Create new stock movement records for the updated items
                const stockMovements = [];
                for (const item of existingReturn.items) {
                    // Create new stock movement record
                    const sm = await createStockMovement(
                        {
                            productId: item.productId,
                            returnId: existingReturn._id,
                            quantityChange: item.quantity,
                            movementType: STOCK_MOVEMENT_TYPE.RETURN,
                            notes: `Updated return from order ${existingReturn.orderId} - ${existingReturn.note || ""}`,
                            userId: req.user.id,
                        },
                        session,
                    );
                    stockMovements.push(sm);

                    // Update product theoretical stock
                    await Product.findByIdAndUpdate(
                        item.productId,
                        {
                            $inc: {
                                totalSold: -item.quantity,
                                totalTheoreticalStock: item.quantity,
                            },
                        },
                        { session },
                    );
                }

                return { existingReturn, stockMovements };
            });

            res.status(200).json(
                response("Return updated successfully", { existingReturn, stockMovements }),
            );
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
            const { id } = req.params;

            const returnDoc = await session.withTransaction(async () => {
                // Find the return
                const returnDoc = await Return.findById(id).session(session);
                if (!returnDoc) {
                    throw createError("Return not found", 404);
                }

                // Step 1: Delete stock movement records
                await StockMovement.deleteMany(
                    {
                        returnId: returnDoc._id,
                    },
                    { session },
                );

                // Revert theoretical stock (decrease as return is cancelled/deleted)
                for (const item of returnDoc.items) {
                    const r = await Product.updateOne(
                        {
                            _id: item.productId,
                            totalTheoreticalStock: { $gte: item.quantity },
                        },
                        {
                            $inc: {
                                totalTheoreticalStock: -item.quantity,
                                totalSold: item.quantity,
                            },
                        },
                        { session },
                    );
                    if (r.modifiedCount !== 1) {
                        throw createError(
                            `Product ${item.productId} cannot delete its return`,
                            409,
                        );
                    }
                }

                // Step 2: Delete the return
                await Return.findByIdAndDelete(id, { session });

                return returnDoc;
            });

            res.status(200).json(response("Return deleted successfully", returnDoc));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },
};

module.exports = returnController;
