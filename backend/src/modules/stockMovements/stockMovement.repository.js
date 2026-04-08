const StockMovement = require("./stockMovement.model");

const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

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
        destinationLocation,
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
    if (destinationLocation != null) doc.destinationLocation = destinationLocation;
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

const stockMovementRepository = {
    createStockMovement,
    deleteByReturnId,
};

module.exports = stockMovementRepository;
