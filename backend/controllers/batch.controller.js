const mongoose = require("mongoose");
const Batch = require("../models/batch.model");
const BatchEvent = require("../models/batchEvent.model");
const Product = require("../models/product.model");
const StockMovement = require("../models/stockMovement.model");
const { BATCH_STATUS } = require("../enums/batch.enums");
const { BATCH_EVENT_STAGES } = require("../enums/batchEvent.enums");
const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");

const batchController = {
    // 1. Create Batch (Planning)
    createBatch: async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { batchNumber, productId, orderId, plannedQuantity, startDate } = req.body;

            // Check if batch number exists
            const existingBatch = await Batch.findOne({ batchNumber }).session(session);
            if (existingBatch) {
                throw createError("Batch number already exists", 409);
            }

            // Create Batch
            const newBatch = new Batch({
                batchNumber,
                productId,
                orderId,
                plannedQuantity,
                startDate: startDate || Date.now(),
                status: BATCH_STATUS.PLANNING,
            });
            await newBatch.save({ session });

            // Create Initial Batch Event (Planning)
            const newEvent = new BatchEvent({
                code: `EVT-${batchNumber}-PLAN`, // Simple code generation logic
                batchId: newBatch._id,
                stage: BATCH_EVENT_STAGES.PLANNING,
                loss: 0,
                startDate: startDate || Date.now(),
                // finalizedByUserId is null initially
            });
            await newEvent.save({ session });

            await session.commitTransaction();
            res.status(201).json(
                response("Batch created successfully", { batch: newBatch, event: newEvent }),
            );
        } catch (err) {
            await session.abortTransaction();
            next(err);
        } finally {
            session.endSession();
        }
    },

    // 2. Read All Batches
    getAllBatches: async (req, res, next) => {
        try {
            const batches = await Batch.find()
                .populate("productId", "name code")
                .populate("orderId", "orderNumber");
            res.status(200).json(response("Batches retrieved successfully", batches));
        } catch (err) {
            return next(err);
        }
    },

    // 3. Read Single Batch
    getBatchById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const batch = await Batch.findById(id)
                .populate("productId", "name code")
                .populate("orderId", "orderNumber");

            if (!batch) {
                return next(createError("Batch not found", 404));
            }

            const events = await BatchEvent.find({ batchId: id });

            res.status(200).json(response("Batch retrieved successfully", { batch, events }));
        } catch (err) {
            return next(err);
        }
    },

    // 4. Update Batch (Planner)
    updateBatch: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const batch = await Batch.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true,
            });

            if (!batch) {
                return next(createError("Batch not found", 404));
            }

            res.status(200).json(response("Batch updated successfully", batch));
        } catch (err) {
            return next(err);
        }
    },

    // 5. Delete Batch (Admin)
    deleteBatch: async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;

            const batch = await Batch.findById(id).session(session);
            if (!batch) {
                throw createError("Batch not found", 404);
            }

            // Delete associated events
            await BatchEvent.deleteMany({ batchId: id }).session(session);

            // Delete batch
            await Batch.deleteOne({ _id: id }).session(session);

            await session.commitTransaction();
            res.status(200).json(response("Batch deleted successfully", batch));
        } catch (err) {
            await session.abortTransaction();
            next(err);
        } finally {
            session.endSession();
        }
    },

    // 6. Finalize Planning -> Transition to Production
    finalizePlanning: async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const { startDate } = req.body; // Start date of production

            const batch = await Batch.findById(id).session(session);
            if (!batch) {
                throw createError("Batch not found", 404);
            }

            if (batch.status !== BATCH_STATUS.PLANNING) {
                throw createError("Batch is not in planning status", 400);
            }

            // Update Batch Status
            batch.status = BATCH_STATUS.PRODUCTION;
            await batch.save({ session });

            // Finalize Planning Event
            const planningEvent = await BatchEvent.findOne({
                batchId: id,
                stage: BATCH_EVENT_STAGES.PLANNING,
            }).session(session);

            if (planningEvent) {
                planningEvent.endDate = Date.now();
                planningEvent.finalizedByUserId = req.user.id;
                await planningEvent.save({ session });
            }

            // Create Production Event
            const productionEvent = new BatchEvent({
                code: `EVT-${batch.batchNumber}-PROD`,
                batchId: id,
                stage: BATCH_EVENT_STAGES.PRODUCTION,
                loss: 0,
                startDate: startDate || Date.now(),
            });
            await productionEvent.save({ session });

            await session.commitTransaction();
            res.status(200).json(
                response("Planning finalized, batch moved to production", {
                    batch,
                    productionEvent,
                }),
            );
        } catch (err) {
            await session.abortTransaction();
            next(err);
        } finally {
            session.endSession();
        }
    },

    // 7. Finalize Production -> Transition to Done
    finalizeProduction: async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const { producedQuantity, endDate } = req.body;

            if (producedQuantity === undefined || producedQuantity < 0) {
                throw createError("Produced quantity is required and must be non-negative", 400);
            }

            const batch = await Batch.findById(id).session(session);
            if (!batch) {
                throw createError("Batch not found", 404);
            }

            if (batch.status !== BATCH_STATUS.PRODUCTION) {
                throw createError("Batch is not in production status", 400);
            }

            // Update Batch
            batch.status = BATCH_STATUS.DONE;
            batch.producedQuantity = producedQuantity;
            batch.endDate = endDate || Date.now();
            await batch.save({ session });

            const loss = batch.plannedQuantity - producedQuantity;

            // Finalize Production Event
            const productionEvent = await BatchEvent.findOne({
                batchId: id,
                stage: BATCH_EVENT_STAGES.PRODUCTION,
            }).session(session);

            if (productionEvent) {
                productionEvent.endDate = endDate || Date.now();
                productionEvent.loss = loss;
                productionEvent.finalizedByUserId = req.user.id;
                await productionEvent.save({ session });
            }

            // *** Stock Integration Logic ***
            const stockUpdate = {};

            if (batch.orderId) {
                // If there is an order, the produced items are reserved for it
                if (!stockUpdate.$inc) stockUpdate.$inc = {};
                stockUpdate.$inc.totalReserved = producedQuantity;
            } else {
                // If no order, they are theoretical stock (available for future orders)
                if (!stockUpdate.$inc) stockUpdate.$inc = {};
                stockUpdate.$inc.totalTheoreticalStock = producedQuantity;
            }

            if (stockUpdate.$inc) {
                await Product.findByIdAndUpdate(batch.productId, stockUpdate).session(session);
            }

            // Create Stock Movement
            const stockMovement = new StockMovement({
                productId: batch.productId,
                batchId: batch._id,
                quantityChange: producedQuantity,
                movementType: STOCK_MOVEMENT_TYPE.BATCH,
                movementTime: Date.now(),
                notes: `Batch ${batch.batchNumber} production finalized`,
                userId: req.user.id,
            });
            await stockMovement.save({ session });

            await session.commitTransaction();
            res.status(200).json(
                response("Production finalized, batch completed", { batch, stockMovement }),
            );
        } catch (err) {
            await session.abortTransaction();
            next(err);
        } finally {
            session.endSession();
        }
    },
};

module.exports = batchController;
