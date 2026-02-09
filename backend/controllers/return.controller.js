const Return = require("../models/return.model");
const Product = require("../models/product.model");
const StockMovement = require("../models/stockMovement.model");
const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");

const returnController = {
    // 1. Create return - creates return record and stock movement
    createReturn: async (req, res, next) => {
        try {
            const { orderId, note, returnDate, items } = req.body;

            if (!items || items.length === 0) {
                return next(createError("Return must have at least one item", 400));
            }

            // Create the return
            const newReturn = new Return({
                orderId,
                userId: req.user.id,
                note,
                returnDate: returnDate || Date.now(),
                items,
            });

            await newReturn.save();

            // Process each item: create stock movement
            const stockMovements = [];
            for (const item of items) {
                // Create stock movement record
                const stockMovement = new StockMovement({
                    productId: item.productId,
                    returnId: newReturn._id,
                    quantityChange: item.quantity,
                    movementType: STOCK_MOVEMENT_TYPE.RETURN,
                    movementTime: returnDate || Date.now(),
                    notes: `Return from order ${orderId} - ${note || ""}`,
                    userId: req.user.id,
                });

                await stockMovement.save();
                stockMovements.push(stockMovement);

                // Update product theoretical stock
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { totalTheoreticalStock: item.quantity },
                });
            }

            res.status(201).json(
                response("Return created successfully", { newReturn, stockMovements }),
            );
        } catch (err) {
            next(err);
        }
    },

    // 2. Get all returns
    getAllReturns: async (req, res, next) => {
        try {
            const returns = await Return.find()
                .populate("orderId")
                .populate("userId")
                .populate("items.productId");

            res.status(200).json(response("Returns retrieved successfully", returns));
        } catch (err) {
            next(err);
        }
    },

    // 3. Get returns by product ID
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
            next(err);
        }
    },

    // 4. Get returns by order ID
    getReturnsByOrderId: async (req, res, next) => {
        try {
            const { orderId } = req.params;

            const returns = await Return.find({ orderId })
                .populate("orderId")
                .populate("userId")
                .populate("items.productId");

            res.status(200).json(response("Order returns retrieved successfully", returns));
        } catch (err) {
            next(err);
        }
    },

    // 5. Update return - updates return record and creates new stock movements
    updateReturn: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { orderId, note, returnDate, items } = req.body;

            // Find the existing return
            const existingReturn = await Return.findById(id);
            if (!existingReturn) {
                return next(createError("Return not found", 404));
            }

            // Step 1: Delete old stock movement records
            // Find stock movements created for this return
            await StockMovement.deleteMany({
                returnId: existingReturn._id,
            });

            // Revert theoretical stock for old items
            for (const item of existingReturn.items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { totalTheoreticalStock: -item.quantity },
                });
            }

            // Step 2: Update the return document
            existingReturn.orderId = orderId || existingReturn.orderId;
            existingReturn.note = note !== undefined ? note : existingReturn.note;
            existingReturn.returnDate = returnDate || existingReturn.returnDate;
            existingReturn.items = items || existingReturn.items;

            await existingReturn.save();

            // Step 3: Create new stock movement records for the updated items
            const stockMovements = [];
            for (const item of existingReturn.items) {
                // Create new stock movement record
                const stockMovement = new StockMovement({
                    productId: item.productId,
                    returnId: existingReturn._id,
                    quantityChange: item.quantity,
                    movementType: STOCK_MOVEMENT_TYPE.RETURN,
                    movementTime: existingReturn.returnDate,
                    notes: `Updated return from order ${existingReturn.orderId} - ${existingReturn.note || ""}`,
                    userId: req.user.id,
                });

                await stockMovement.save();
                stockMovements.push(stockMovement);

                // Update product theoretical stock
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { totalTheoreticalStock: item.quantity },
                });
            }

            res.status(200).json(
                response("Return updated successfully", { existingReturn, stockMovements }),
            );
        } catch (err) {
            next(err);
        }
    },

    // 6. Delete return - deletes return and associated stock movements
    deleteReturn: async (req, res, next) => {
        try {
            const { id } = req.params;

            // Find the return
            const returnDoc = await Return.findById(id);
            if (!returnDoc) {
                return next(createError("Return not found", 404));
            }

            // Step 1: Delete stock movement records
            await StockMovement.deleteMany({
                returnId: returnDoc._id,
            });

            // Revert theoretical stock (decrease as return is cancelled/deleted)
            for (const item of returnDoc.items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { totalTheoreticalStock: -item.quantity },
                });
            }

            // Step 2: Delete the return
            await Return.findByIdAndDelete(id);

            res.status(200).json(response("Return deleted successfully", returnDoc));
        } catch (err) {
            next(err);
        }
    },
};

module.exports = returnController;
