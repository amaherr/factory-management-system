const stockMovementRepository = require("./stockMovement.repository");
const productRepository = require("../products/product.repository");
const { WAREHOUSE_ACTIONS, EXECUTION_STATUS } = require("../../enums/stockMovement.enums");

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

function normalizeAllocations(rawAllocations) {
    if (!Array.isArray(rawAllocations) || rawAllocations.length === 0) {
        return [];
    }

    const merged = new Map();

    for (const allocation of rawAllocations) {
        const location = String(allocation.location || "").trim();
        const section = String(allocation.section || "").trim();
        const quantity = Number(allocation.quantity || 0);

        if (!location || !section || !Number.isFinite(quantity) || quantity <= 0) {
            throw createError(
                "Each allocation must include location, section, and positive quantity",
                400,
            );
        }

        const key = `${location}::${section}`;
        const existing = merged.get(key);
        if (existing) {
            existing.quantity += quantity;
        } else {
            merged.set(key, { location, section, quantity });
        }
    }

    return Array.from(merged.values());
}

function aggregateQuantityByLocation(allocations) {
    const byLocation = new Map();
    for (const allocation of allocations) {
        byLocation.set(
            allocation.location,
            (byLocation.get(allocation.location) || 0) + Number(allocation.quantity || 0),
        );
    }
    return byLocation;
}

function mergeAllocations(existingAllocations, newAllocations) {
    return normalizeAllocations([...(existingAllocations || []), ...(newAllocations || [])]);
}

function getExecutionStatus(executedQuantity, totalQuantity) {
    if (executedQuantity <= 0) {
        return EXECUTION_STATUS.NOT_EXECUTED;
    }

    if (executedQuantity >= totalQuantity) {
        return EXECUTION_STATUS.EXECUTED;
    }

    return EXECUTION_STATUS.PARTIALLY_EXECUTED;
}

const executeWarehouseMovement = async ({
    movementId,
    userId,
    requiredAction,
    allocations,
    allocationsField,
}) => {
    const normalizedAllocations = normalizeAllocations(allocations);
    const totalAllocatedQuantity = normalizedAllocations.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
    );

    let stockMovement;
    await transactionManager.run(async (tx) => {
        const existingMovement = await stockMovementRepository.getMovementForExecution(
            movementId,
            tx,
        );

        if (!existingMovement) {
            throw createError("Stock movement not found", 404);
        }

        if (existingMovement.executionStatus === EXECUTION_STATUS.EXECUTED) {
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

        const quantity = Math.abs(Number(existingMovement.quantityChange));
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw createError("Stock movement has invalid quantityChange", 409);
        }

        const executedQuantity = Number(existingMovement.physicalQuantityExecuted || 0);
        if (!Number.isFinite(executedQuantity) || executedQuantity < 0) {
            throw createError("Stock movement has invalid executed quantity", 409);
        }

        const remainingQuantity = quantity - executedQuantity;
        if (remainingQuantity <= 0) {
            throw createError("Stock movement already fully executed", 409);
        }

        if (totalAllocatedQuantity > remainingQuantity) {
            throw createError("Total allocated quantity cannot exceed remaining movement quantity", 400);
        }

        if (totalAllocatedQuantity <= 0) {
            throw createError("Allocated quantity must be greater than zero", 400);
        }

        const product = await productRepository.getProductById(existingMovement.productId, tx);
        if (!product) {
            throw createError("Product not found", 404);
        }

        const totalPhysicalStock = Number(product.totalPhysicalStock || 0);
        const locationQuantityMap = aggregateQuantityByLocation(normalizedAllocations);

        if (requiredAction === WAREHOUSE_ACTIONS.PICK) {
            if (totalPhysicalStock < totalAllocatedQuantity) {
                throw createError("Stock totals cannot become negative", 409);
            }

            for (const [location, locationQuantity] of locationQuantityMap.entries()) {
                const sourceLoc = findLocation(product, location);

                if (!sourceLoc) {
                    throw createError(`Source location ${location} not found in product`, 404);
                }

                if (sourceLoc.quantityInStock < locationQuantity) {
                    throw createError(`Insufficient stock in source location ${location}`, 400);
                }
            }

            for (const [location, locationQuantity] of locationQuantityMap.entries()) {
                const sourceLoc = findLocation(product, location);
                sourceLoc.quantityInStock -= locationQuantity;
            }

            product.totalPhysicalStock = totalPhysicalStock - totalAllocatedQuantity;
        } else if (requiredAction === WAREHOUSE_ACTIONS.RECEIVE) {
            for (const [location, locationQuantity] of locationQuantityMap.entries()) {
                const destinationLoc = ensureLocation(product, location);
                destinationLoc.quantityInStock += locationQuantity;
            }

            product.totalPhysicalStock = totalPhysicalStock + totalAllocatedQuantity;
        }

        await productRepository.updateProductInventorySnapshot(
            {
                productId: product._id,
                locations: product.locations,
                totalPhysicalStock: product.totalPhysicalStock,
                totalTheoreticalStock: product.totalTheoreticalStock,
            },
            tx,
        );

        const mergedAllocations = mergeAllocations(
            existingMovement[allocationsField],
            normalizedAllocations,
        );
        const nextExecutedQuantity = executedQuantity + totalAllocatedQuantity;
        const executionStatus = getExecutionStatus(nextExecutedQuantity, quantity);

        const locationUpdates = {
            [allocationsField]: mergedAllocations,
            physicalQuantityExecuted: nextExecutedQuantity,
            executionStatus,
        };

        const updatedMovement = await stockMovementRepository.updateMovementExecution(
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
                executionStatus,
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

            if (executionStatus) {
                const executionStatuses = String(executionStatus)
                    .split(",")
                    .map((status) => status.trim())
                    .filter(Boolean);

                filter.executionStatus =
                    executionStatuses.length > 1 ? { $in: executionStatuses } : executionStatuses[0];
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
            const { sourceAllocations } = req.body;
            const movementId = req.params.movementId;
            const userId = req.user.id;

            const stockMovement = await executeWarehouseMovement({
                movementId,
                userId,
                requiredAction: WAREHOUSE_ACTIONS.PICK,
                allocations: sourceAllocations,
                allocationsField: "sourceAllocations",
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
            const { destinationAllocations } = req.body;
            const movementId = req.params.movementId;
            const userId = req.user.id;

            const stockMovement = await executeWarehouseMovement({
                movementId,
                userId,
                requiredAction: WAREHOUSE_ACTIONS.RECEIVE,
                allocations: destinationAllocations,
                allocationsField: "destinationAllocations",
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
