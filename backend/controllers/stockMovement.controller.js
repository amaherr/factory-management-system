const mongoose = require("mongoose");

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
                movementType, // filter by movement type
                from, // date range filter
                to,
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

            if (movementType) {
                filter.movementType = movementType;
            }

            // date range
            if (from || to) {
                filter.createdAt = {};
                if (from) filter.createdAt.$gte = new Date(from);
                if (to) filter.createdAt.$lte = new Date(to);
            }

            // search by product code
            if (q) {
                const product = await Product.findOne({ code: q });
                if (product) {
                    filter.productId = product._id;
                }
            }

            // calculate skip
            const skip = (pageNum - 1) * limitNum;

            // get total count for pagination
            const total = await StockMovement.countDocuments(filter);

            // get stock movements
            const movements = await StockMovement.find(filter)
                .populate("productId", "code name")
                .populate("userId", "name email")
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
                .populate("userId", "name email")
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
                .populate("userId", "name email")
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
};

module.exports = stockMovementController;
