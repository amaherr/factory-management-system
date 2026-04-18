const StockMovement = require("./stockMovement.model");

const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

// ------------ Helpers ------------

function populateMovementSummary(query) {
    return query
        .populate("productId", "code name")
        .populate("createdByUserId", "name email")
        .populate("physicalExecutedByUserId", "name email")
        .populate("orderId", "orderNumber")
        .populate("returnId", "returnNumber")
        .populate("batchId", "batchNumber");
}

function populateMovementDetails(query) {
    return query
        .populate("productId")
        .populate("createdByUserId", "name email")
        .populate("physicalExecutedByUserId", "name email")
        .populate("orderId")
        .populate("returnId")
        .populate("batchId");
}

// ------------ Repository ------------

async function createStockMovement(data, tx = null) {
    const session = getMongoSession(tx);
    if (!session) {
        throw new Error("Session is required to create a stock movement");
    }

    const {
        productId,
        quantityChange,
        from,
        to,
        createdByUserId,
        notes,
        orderId,
        returnId,
        batchId,
        warehouseAction,
        isExecuted,
        sourceLocation,
        sourceSection,
        destinationLocation,
        destinationSection,
        physicalExecutedAt,
        physicalExecutedByUserId,
    } = data;

    const doc = {
        productId,
        quantityChange,
        from,
        to,
        createdByUserId,
        isExecuted: isExecuted ?? false,
    };

    if (notes != null) doc.notes = notes;
    if (orderId != null) doc.orderId = orderId;
    if (returnId != null) doc.returnId = returnId;
    if (batchId != null) doc.batchId = batchId;
    if (warehouseAction != null) doc.warehouseAction = warehouseAction;
    if (sourceLocation != null) doc.sourceLocation = sourceLocation;
    if (sourceSection != null) doc.sourceSection = sourceSection;
    if (destinationLocation != null) doc.destinationLocation = destinationLocation;
    if (destinationSection != null) doc.destinationSection = destinationSection;
    if (physicalExecutedAt != null) doc.physicalExecutedAt = physicalExecutedAt;
    if (physicalExecutedByUserId != null) doc.physicalExecutedByUserId = physicalExecutedByUserId;

    const [movement] = await StockMovement.create([doc], { session });
    return movement;
}

async function deleteByReturnId(returnId, tx = null) {
    const session = getMongoSession(tx);
    if (session) {
        return StockMovement.deleteMany({ returnId }, { session });
    }
    return StockMovement.deleteMany({ returnId });
}

async function deleteByOrderId(orderId, tx = null) {
    const session = getMongoSession(tx);
    if (session) {
        return StockMovement.deleteMany({ orderId }, { session });
    }
    return StockMovement.deleteMany({ orderId });
}

async function deleteReservationMovementsByOrderId(orderId, tx = null) {
    const session = getMongoSession(tx);
    const filter = {
        orderId,
        $or: [
            {
                from: "INVENTORY",
                to: "RESERVE",
            },
            {
                from: "RESERVE",
                to: "INVENTORY",
            },
        ],
    };

    if (session) {
        return StockMovement.deleteMany(filter, { session });
    }
    return StockMovement.deleteMany(filter);
}

async function countStockMovements(data, tx = null) {
    const { filter } = data;
    const session = getMongoSession(tx);
    const query = StockMovement.countDocuments(filter);
    if (session) {
        query.session(session);
    }
    return query;
}

async function getStockMovements(data, tx = null) {
    const { filter, skip, limit } = data;
    const session = getMongoSession(tx);
    const query = populateMovementSummary(StockMovement.find(filter))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    if (session) {
        query.session(session);
    }

    return query;
}

async function getStockMovementById(movementId, tx = null) {
    const session = getMongoSession(tx);
    const query = populateMovementDetails(StockMovement.findById(movementId));
    if (session) {
        query.session(session);
    }
    return query;
}

async function countByProductId(productId, tx = null) {
    const session = getMongoSession(tx);
    const query = StockMovement.countDocuments({ productId });
    if (session) {
        query.session(session);
    }
    return query;
}

async function getByProductId(data, tx = null) {
    const { productId, skip, limit } = data;
    const session = getMongoSession(tx);
    const query = populateMovementSummary(StockMovement.find({ productId }))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    if (session) {
        query.session(session);
    }
    return query;
}

async function getMovementForExecution(movementId, tx = null) {
    const session = getMongoSession(tx);
    const query = StockMovement.findById(movementId).select(
        "_id isExecuted warehouseAction productId quantityChange",
    );
    if (session) {
        query.session(session);
    }
    return query;
}

async function markMovementExecuted(data, tx = null) {
    const { movementId, userId, locationUpdates } = data;
    const session = getMongoSession(tx);
    const options = { new: true };
    if (session) {
        options.session = session;
    }

    const query = populateMovementSummary(
        StockMovement.findOneAndUpdate(
            {
                _id: movementId,
                isExecuted: false,
            },
            {
                $set: {
                    isExecuted: true,
                    ...locationUpdates,
                    physicalExecutedAt: new Date(),
                    physicalExecutedByUserId: userId,
                },
            },
            options,
        ),
    );

    if (session) {
        query.session(session);
    }
    return query;
}

const stockMovementRepository = {
    createStockMovement,
    deleteByReturnId,
    deleteByOrderId,
    deleteReservationMovementsByOrderId,
    countStockMovements,
    getStockMovements,
    getStockMovementById,
    countByProductId,
    getByProductId,
    getMovementForExecution,
    markMovementExecuted,
};

module.exports = stockMovementRepository;
