const stockMovementRepository = require("./stockMovement.repository");
const productRepository = require("../products/product.repository");
const { WAREHOUSE_ACTIONS } = require("../../enums/stockMovement.enums");

const response = require("../../utils/responseFactory");
const createError = require("../../utils/errorFactory");
const transactionManager = require("../../database/transactionManager/instance");

// ------------ Helpers ------------

function findLocation(product, location) {
    return product.locations.find((entry) => entry.location === location);
}

function ensureLocation(product, location) {
    let existingLocation = findLocation(product, location);

    if (!existingLocation) {
        product.locations.push({
            location,
            quantityInStock: 0,
        });
        existingLocation = product.locations[product.locations.length - 1];
    }

    return existingLocation;
}

const executeWarehouseMovement = async ({
    movementId,
    userId,
    requiredAction,
    locationField,
    locationUpdates,
}) => {
    const executionLocation = locationUpdates[locationField];
    let stockMovement;
    await transactionManager.run(async (tx) => {
        const existingMovement = await stockMovementRepository.getMovementForExecution(
            movementId,
            tx,
        );

        if (!existingMovement) {
            throw createError("Stock movement not found", 404);
        }

        if (existingMovement.isExecuted) {
            throw createError("Stock movement already executed", 409);
        }

        if (!existingMovement.warehouseAction) {
            throw createError("Stock movement does not require physical execution", 400);
        }

        if (existingMovement.warehouseAction !== requiredAction) {
            throw createError(
                `Stock movement requires '${existingMovement.warehouseAction}' execution action`,
                400,
            );
        }

        const quantity = Number(existingMovement.quantityChange);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw createError("Stock movement has invalid quantityChange", 409);
        }

        const product = await productRepository.getProductById(existingMovement.productId, tx);
        if (!product) {
            throw createError("Product not found", 404);
        }

        const totalPhysicalStock = Number(product.totalPhysicalStock || 0);

        if (requiredAction === WAREHOUSE_ACTIONS.PICK) {
            const sourceLoc = findLocation(product, executionLocation);

            if (!sourceLoc) {
                throw createError(`Source location ${executionLocation} not found in product`, 404);
            }

            if (sourceLoc.quantityInStock < quantity) {
                throw createError("Insufficient stock in source location", 400);
            }

            if (totalPhysicalStock < quantity) {
                throw createError("Stock totals cannot become negative", 409);
            }

            sourceLoc.quantityInStock -= quantity;
            product.totalPhysicalStock = totalPhysicalStock - quantity;
        } else if (requiredAction === WAREHOUSE_ACTIONS.RECEIVE) {
            const destinationLoc = ensureLocation(product, executionLocation);

            destinationLoc.quantityInStock += quantity;
            product.totalPhysicalStock = totalPhysicalStock + quantity;
        }

        await productRepository.saveProduct({ productDoc: product }, tx);

        const updatedMovement = await stockMovementRepository.markMovementExecuted(
            {
                movementId,
                userId,
                locationUpdates,
            },
            tx,
        );

        if (!updatedMovement) {
            throw createError("Stock movement already executed", 409);
        }

        stockMovement = updatedMovement;
    });

    return stockMovement;
};

// ------------ Services ------------

const stockMovementService = {
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
                const product = await productRepository.findByCode(q);
                if (product) {
                    filter.productId = product._id;
                } else {
                    filter.productId = null;
                }
            }

            // calculate skip
            const skip = (pageNum - 1) * limitNum;

            // get total count for pagination
            const total = await stockMovementRepository.countStockMovements({ filter });

            // get stock movements
            const movements = await stockMovementRepository.getStockMovements({
                filter,
                skip,
                limit: limitNum,
            });

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
            const movement = await stockMovementRepository.getStockMovementById(movementId);

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
            const total = await stockMovementRepository.countByProductId(productId);

            // get movements
            const movements = await stockMovementRepository.getByProductId({
                productId,
                skip,
                limit: limitNum,
            });

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

    // function to execute a pick stock movement
    executePickStockMovement: async (req, res, next) => {
        try {
            const { sourceLocation, sourceSection } = req.body;
            const movementId = req.params.movementId;
            const userId = req.user.id;

            const stockMovement = await executeWarehouseMovement({
                movementId,
                userId,
                requiredAction: WAREHOUSE_ACTIONS.PICK,
                locationField: "sourceLocation",
                locationUpdates: { sourceLocation, sourceSection },
            });

            return res
                .status(200)
                .json(response("Stock movement pick executed successfully", stockMovement));
        } catch (err) {
            return next(err);
        }
    },

    // function to execute a receive stock movement
    executeReceiveStockMovement: async (req, res, next) => {
        try {
            const { destinationLocation, destinationSection } = req.body;
            const movementId = req.params.movementId;
            const userId = req.user.id;

            const stockMovement = await executeWarehouseMovement({
                movementId,
                userId,
                requiredAction: WAREHOUSE_ACTIONS.RECEIVE,
                locationField: "destinationLocation",
                locationUpdates: { destinationLocation, destinationSection },
            });

            return res
                .status(200)
                .json(response("Stock movement receive executed successfully", stockMovement));
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = stockMovementService;
