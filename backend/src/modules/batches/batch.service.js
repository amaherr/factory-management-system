const batchRepository = require("./batch.repository");
const batchEventRepository = require("./batchEvent.repository");
const productRepository = require("../products/product.repository");
const orderRepository = require("../orders/order.repository");

const { BATCH_STATUS } = require("../../enums/batch.enums");
const { BATCH_EVENT_STAGES } = require("../../enums/batchEvent.enums");
const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../../enums/stockMovement.enums");
const { COUNTERS } = require("../../enums/counter.enums");

const response = require("../../utils/responseFactory");
const createError = require("../../utils/errorFactory");
const { getNextDocumentNumber } = require("../../utils/helpers");
const stockMovementRepository = require("../stockMovements/stockMovement.repository");
const transactionManager = require("../../database/transactionManager/instance");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

const batchService = {
    // Create Batch (Planning)
    createBatch: async (req, res, next) => {
        try {
            const { productId, orderId, plannedQuantity, startDate } = req.body;

            let result;
            await transactionManager.run(async (tx) => {
                const session = getMongoSession(tx);
                // validate order and product ids
                if (orderId) {
                    const order = await orderRepository.getOrderById(orderId, tx);
                    if (!order) {
                        throw createError("Order not found", 404);
                    }
                }
                const product = await productRepository.getProductById(productId, tx);
                if (!product) {
                    throw createError("Product not found", 404);
                }

                // Get next batch number
                const batchNumber = await getNextDocumentNumber(COUNTERS.BATCH_NUMBER, session);

                // Create Batch
                const newBatch = await batchRepository.createBatch(
                    {
                        batchNumber,
                        productId,
                        orderId,
                        plannedQuantity,
                        startDate: startDate || Date.now(),
                        status: BATCH_STATUS.PLANNING,
                    },
                    tx,
                );

                // Create Initial Batch Event (Planning)
                const newEvent = await batchEventRepository.createBatchEvent(
                    {
                        code: `EVT-${batchNumber}-PLAN`,
                        batchId: newBatch._id,
                        stage: BATCH_EVENT_STAGES.PLANNING,
                        loss: 0,
                        startDate: startDate || Date.now(),
                    },
                    tx,
                );

                result = { newBatch, newEvent };
            });

            const { newBatch, newEvent } = result;

            res.status(201).json(
                response("Batch created successfully", { batch: newBatch, event: newEvent }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // Read All Batches
    getAllBatches: async (req, res, next) => {
        try {
            const batches = await batchRepository.getAllBatches();
            res.status(200).json(response("Batches retrieved successfully", batches));
        } catch (err) {
            return next(err);
        }
    },

    // Read Single Batch
    getBatchById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const batch = await batchRepository.getBatchById(id);

            if (!batch) {
                return next(createError("Batch not found", 404));
            }

            const events = await batchEventRepository.getEventsByBatchId(id);

            res.status(200).json(response("Batch retrieved successfully", { batch, events }));
        } catch (err) {
            return next(err);
        }
    },

    // Update Batch (Planner)
    updateBatch: async (req, res, next) => {
        try {
            const batchId = req.params.batchId;
            const { productId, orderId, plannedQuantity, startDate } = req.body;

            let result;
            await transactionManager.run(async (tx) => {
                // 1) Load batch + enforce PLANNING only
                const batch = await batchRepository.getBatchByIdRaw(batchId, tx);
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
                const updatedBatch = await batchRepository.updatePlanningBatchById(
                    {
                        batchId,
                        updateObject: update,
                    },
                    tx,
                );

                if (!updatedBatch) {
                    throw createError("Batch not found or cannot be edited", 409);
                }

                // 4) Keep the planning event in sync when startDate changes
                let updatedEvent = null;
                if (newStartDate) {
                    updatedEvent = await batchEventRepository.updatePlanningEventStartDate(
                        {
                            batchId: updatedBatch._id,
                            startDate: newStartDate,
                        },
                        tx,
                    );

                    if (!updatedEvent) {
                        throw createError("Planning batch event not found", 404);
                    }
                }

                result = { updatedBatch, updatedEvent };
            });

            const { updatedBatch, updatedEvent } = result;

            return res.status(200).json(
                response("Batch updated successfully", {
                    batch: updatedBatch,
                    event: updatedEvent,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // Delete Batch (Admin)
    deleteBatch: async (req, res, next) => {
        try {
            const { id } = req.params;

            let batch;
            await transactionManager.run(async (tx) => {
                batch = await batchRepository.getBatchByIdRaw(id, tx);
                if (!batch) {
                    throw createError("Batch not found", 404);
                }
                if (batch.status !== BATCH_STATUS.PLANNING) {
                    throw createError("Batch cannot be deleted", 409);
                }

                await batchEventRepository.deleteEventsByBatchId(id, tx);
                await batchRepository.deleteBatchById(id, tx);
            });

            res.status(200).json(response("Batch deleted successfully", batch));
        } catch (err) {
            return next(err);
        }
    },

    // Finalize Planning -> Transition to Production
    finalizePlanning: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { startDate } = req.body; // Start date of production

            let result;
            await transactionManager.run(async (tx) => {
                const batch = await batchRepository.getBatchByIdRaw(id, tx);
                if (!batch) {
                    throw createError("Batch not found", 404);
                }

                if (batch.status !== BATCH_STATUS.PLANNING) {
                    throw createError("Batch is not in planning status", 400);
                }

                batch.status = BATCH_STATUS.PRODUCTION;
                await batchRepository.saveBatch({ batchDoc: batch }, tx);

                const planningEvent = await batchEventRepository.getEventByBatchIdAndStage(
                    {
                        batchId: id,
                        stage: BATCH_EVENT_STAGES.PLANNING,
                    },
                    tx,
                );

                if (planningEvent) {
                    planningEvent.endDate = Date.now();
                    planningEvent.finalizedByUserId = req.user.id;
                    await batchEventRepository.saveBatchEvent({ eventDoc: planningEvent }, tx);
                }

                const productionEvent = await batchEventRepository.createBatchEvent(
                    {
                        code: `EVT-${batch.batchNumber}-PROD`,
                        batchId: id,
                        stage: BATCH_EVENT_STAGES.PRODUCTION,
                        loss: 0,
                        startDate: startDate || Date.now(),
                    },
                    tx,
                );

                result = { batch, productionEvent };
            });

            const { batch, productionEvent } = result;
            res.status(200).json(
                response("Planning finalized, batch moved to production", {
                    batch,
                    productionEvent,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // Finalize Production -> Transition to Done
    finalizeProduction: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { producedQuantity, endDate } = req.body;

            if (producedQuantity === undefined || producedQuantity < 0) {
                throw createError("Produced quantity is required and must be non-negative", 400);
            }

            let result;
            await transactionManager.run(async (tx) => {
                const batch = await batchRepository.getBatchByIdRaw(id, tx);
                if (!batch) {
                    throw createError("Batch not found", 404);
                }

                if (batch.status !== BATCH_STATUS.PRODUCTION) {
                    throw createError("Batch is not in production status", 400);
                }

                batch.status = BATCH_STATUS.DONE;
                batch.producedQuantity = producedQuantity;
                batch.endDate = endDate || Date.now();
                await batchRepository.saveBatch({ batchDoc: batch }, tx);

                const loss = batch.plannedQuantity - producedQuantity;

                const productionEvent = await batchEventRepository.getEventByBatchIdAndStage(
                    {
                        batchId: id,
                        stage: BATCH_EVENT_STAGES.PRODUCTION,
                    },
                    tx,
                );

                if (productionEvent) {
                    productionEvent.endDate = endDate || Date.now();
                    productionEvent.loss = loss;
                    productionEvent.finalizedByUserId = req.user.id;
                    await batchEventRepository.saveBatchEvent({ eventDoc: productionEvent }, tx);
                }

                const stockUpdate = {};

                if (batch.orderId) {
                    if (!stockUpdate.$inc) stockUpdate.$inc = {};
                    stockUpdate.$inc.totalReserved = producedQuantity;
                } else {
                    if (!stockUpdate.$inc) stockUpdate.$inc = {};
                    stockUpdate.$inc.totalTheoreticalStock = producedQuantity;
                }

                if (stockUpdate.$inc) {
                    await productRepository.updateProductById(
                        {
                            productId: batch.productId,
                            updateObject: stockUpdate,
                        },
                        tx,
                    );
                }

                const stockMovement = await stockMovementRepository.createStockMovement(
                    {
                        productId: batch.productId,
                        quantityChange: producedQuantity,
                        from: STOCK_MOVEMENT_TYPE.BATCH,
                        to: STOCK_MOVEMENT_TYPE.INVENTORY,
                        createdByUserId: req.user.id,
                        notes: `Batch ${batch.batchNumber} production finalized`,
                        batchId: batch._id,
                        warehouseAction: WAREHOUSE_ACTIONS.RECEIVE,
                    },
                    tx,
                );

                result = { batch, stockMovement };
            });

            const { batch, stockMovement } = result;
            res.status(200).json(
                response("Production finalized, batch completed", { batch, stockMovement }),
            );
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = batchService;
