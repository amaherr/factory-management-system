const StockMovement = require("../models/stockMovement.model");
const Product = require("../models/product.model");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");

const stockMovementController = {
    // function to get all stock movements with pagination
    getStockMovements: async (req, res, next) => {
        try {
            const {
                productId, // filter by product
                q, // search by product code
                fromType, // filter by source stock bucket
                toType, // filter by destination stock bucket
                bucketType, // filter by any stock bucket (matches from OR to)
                warehouseAction,
                isExecuted,
                createdByUserId,
                physicalExecutedByUserId,
                createdFrom, // date range filter
                createdTo,
                page = 1,
                limit = 20,
            } = req.query;

            // parse pagination parameters
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20)); // cap at 100

            // build the filter object
            const filter = {};

            if (productId) {
                filter.productId = productId;
            }

            if (fromType) {
                filter.from = fromType;
            }

            if (toType) {
                filter.to = toType;
            }

            if (bucketType) {
                filter.$or = [{ from: bucketType }, { to: bucketType }];
            }

            if (warehouseAction) {
                filter.warehouseAction = warehouseAction;
            }

            if (typeof isExecuted !== "undefined") {
                filter.isExecuted = isExecuted === "true";
            }

            if (createdByUserId) {
                filter.createdByUserId = createdByUserId;
            }

            if (physicalExecutedByUserId) {
                filter.physicalExecutedByUserId = physicalExecutedByUserId;
            }

            // date range
            if (createdFrom || createdTo) {
                filter.createdAt = {};
                if (createdFrom) filter.createdAt.$gte = new Date(createdFrom);
                if (createdTo) filter.createdAt.$lte = new Date(createdTo);
            }

            // search by product code
            if (q) {
                const product = await Product.findOne({ code: q });
                if (product) {
                    filter.productId = product._id;
                } else {
                    filter.productId = null;
                }
            }

            // calculate skip
            const skip = (pageNum - 1) * limitNum;

            // get total count for pagination
            const total = await StockMovement.countDocuments(filter);

            // get stock movements
            const movements = await StockMovement.find(filter)
                .populate("productId", "code name")
                .populate("createdByUserId", "name email")
                .populate("physicalExecutedByUserId", "name email")
                .populate("orderId", "orderNumber")
                .populate("returnId", "returnNumber")
                .populate("batchId", "batchNumber")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean();

            res.status(200).json(
                response("Stock movements retrieved successfully", {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum),
                    movements,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // function to get a specific stock movement
    getStockMovement: async (req, res, next) => {
        try {
            const { movementId } = req.params;

            // get stock movement
            const movement = await StockMovement.findById(movementId)
                .populate("productId")
                .populate("createdByUserId", "name email")
                .populate("physicalExecutedByUserId", "name email")
                .populate("orderId")
                .populate("returnId")
                .populate("batchId");

            if (!movement) {
                return next(createError("Stock movement not found", 404));
            }

            res.status(200).json(response("Stock movement retrieved successfully", movement));
        } catch (err) {
            return next(err);
        }
    },

    // function to get stock movements for a specific product
    getProductStockMovements: async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            // parse pagination parameters
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

            // calculate skip
            const skip = (pageNum - 1) * limitNum;

            // get total count
            const total = await StockMovement.countDocuments({ productId });

            // get movements
            const movements = await StockMovement.find({ productId })
                .populate("createdByUserId", "name email")
                .populate("physicalExecutedByUserId", "name email")
                .populate("orderId", "orderNumber")
                .populate("returnId", "returnNumber")
                .populate("batchId", "batchNumber")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean();

            res.status(200).json(
                response("Product stock movements retrieved successfully", {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum),
                    movements,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },

    // function to execute a specific stock movement
    executeStockMovement: async (req, res, next) => {
        try {
            const { sourceLocation, destinationLocation } = req.body;
            const movementId = req.params.movementId;
            const userId = req.user.id;

            const existingMovement = await StockMovement.findById(movementId).select(
                "_id isExecuted warehouseAction",
            );

            if (!existingMovement) {
                return next(createError("Stock movement not found", 404));
            }

            if (existingMovement.isExecuted) {
                return next(createError("Stock movement already executed", 409));
            }

            if (!existingMovement.warehouseAction) {
                return next(createError("Stock movement does not require physical execution", 400));
            }

            const stockMovement = await StockMovement.findOneAndUpdate(
                {
                    _id: movementId,
                    isExecuted: false,
                },
                {
                    $set: {
                        isExecuted: true,
                        sourceLocation,
                        destinationLocation,
                        physicalExecutedAt: new Date(),
                        physicalExecutedByUserId: userId,
                    },
                },
                {
                    new: true,
                },
            )
                .populate("productId", "code name")
                .populate("createdByUserId", "name email")
                .populate("physicalExecutedByUserId", "name email")
                .populate("orderId", "orderNumber")
                .populate("returnId", "returnNumber")
                .populate("batchId", "batchNumber");

            if (!stockMovement) {
                return next(createError("Stock movement already executed", 409));
            }

            return res
                .status(200)
                .json(response("Stock movement executed successfully", stockMovement));
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = stockMovementController;
