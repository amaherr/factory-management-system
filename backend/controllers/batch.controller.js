const mongoose = require("mongoose");

const Batch = require("../models/batch.model");
const BatchEvent = require("../models/batchEvent.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const StockMovement = require("../models/stockMovement.model");

const { BATCH_STATUS } = require("../enums/batch.enums");
const { BATCH_EVENT_STAGES } = require("../enums/batchEvent.enums");
const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");
const { COUNTERS } = require("../enums/counter.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");
const { createStockMovement, getNextDocumentNumber } = require("../utils/helpers");

const batchController = {
    // Create Batch (Planning)
    createBatch: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const { productId, orderId, plannedQuantity, startDate } = req.body;

            const { newBatch, newEvent } = await session.withTransaction(async () => {
                // validate order and product ids
                if (orderId) {
                    const order = await Order.findById(orderId).session(session);
                    if (!order) {
                        throw createError("Order not found", 404);
                    }
                }
                const product = await Product.findById(productId).session(session);
                if (!product) {
                    throw createError("Product not found", 404);
                }

                // Get next batch number
                const batchNumber = await getNextDocumentNumber(COUNTERS.BATCH_NUMBER, session);

                // Create Batch
                const [newBatch] = await Batch.create(
                    [
                        {
                            batchNumber,
                            productId,
                            orderId,
                            plannedQuantity,
                            startDate: startDate || Date.now(),
                            status: BATCH_STATUS.PLANNING,
                        },
                    ],
                    { session },
                );

                // Create Initial Batch Event (Planning)
                const [newEvent] = await BatchEvent.create(
                    [
                        {
                            code: `EVT-${batchNumber}-PLAN`, // Simple code generation logic
                            batchId: newBatch._id,
                            stage: BATCH_EVENT_STAGES.PLANNING,
                            loss: 0,
                            startDate: startDate || Date.now(),
                        },
                    ],
                    { session },
                );

                return { newBatch, newEvent };
            });

            res.status(201).json(
                response("Batch created successfully", { batch: newBatch, event: newEvent }),
            );
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // Read All Batches
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

    // Read Single Batch
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

    // Update Batch (Planner)
    updateBatch: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const batchId = req.params.batchId;
            const { productId, orderId, plannedQuantity, startDate } = req.body;

            const { updatedBatch, updatedEvent } = await session.withTransaction(async () => {
                // 1) Load batch + enforce PLANNING only
                const batch = await Batch.findById(batchId).session(session);
                if (!batch) throw createError("Batch not found", 404);
                if (batch.status !== BATCH_STATUS.PLANNING) {
                    throw createError("Only planning batches can be edited", 409);
                }

                // 2) Build allowed updates only
                const update = {};

                if (productId !== undefined) update.productId = productId;

                // allow clearing orderId by sending null
                if (orderId !== undefined) update.orderId = orderId;

                if (plannedQuantity !== undefined) {
                    const pq = Number(plannedQuantity);
                    update.plannedQuantity = pq;
                }

                let newStartDate;
                if (startDate !== undefined) {
                    newStartDate = new Date(startDate);
                    update.startDate = newStartDate;
                }

                // 3) Update batch (still enforcing status PLANNING in query)
                const updatedBatch = await Batch.findOneAndUpdate(
                    { _id: batchId, status: BATCH_STATUS.PLANNING },
                    update,
                    { new: true, runValidators: true, session },
                );

                if (!updatedBatch) {
                    throw createError("Batch not found or cannot be edited", 409);
                }

                // 4) Keep the planning event in sync when startDate changes
                let updatedEvent = null;
                if (newStartDate) {
                    updatedEvent = await BatchEvent.findOneAndUpdate(
                        { batchId: updatedBatch._id, stage: BATCH_EVENT_STAGES.PLANNING },
                        { startDate: newStartDate },
                        { new: true, session },
                    );

                    if (!updatedEvent) {
                        throw createError("Planning batch event not found", 404);
                    }
                }

                return { updatedBatch, updatedEvent };
            });

            return res.status(200).json(
                response("Batch updated successfully", {
                    batch: updatedBatch,
                    event: updatedEvent,
                }),
            );
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // Delete Batch (Admin)
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

    // Finalize Planning -> Transition to Production
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

    // Finalize Production -> Transition to Done
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
            const stockMovement = await createStockMovement(
                {
                    productId: batch.productId,
                    batchId: batch._id,
                    quantityChange: producedQuantity,
                    movementType: STOCK_MOVEMENT_TYPE.BATCH,
                    notes: `Batch ${batch.batchNumber} production finalized`,
                    userId: req.user.id,
                },
                session,
            );

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
