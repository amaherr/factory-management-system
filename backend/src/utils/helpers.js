const Notification = require("../models/notification.model");
const StockMovement = require("../models/stockMovement.model");
const Counter = require("../models/counter.model");

// gets the next number of a document
async function getNextDocumentNumber(name, session) {
    if (!session) {
        throw new Error("Session is required to create get document number");
    }

    const doc = await Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session },
    );
    return doc.seq;
}

// sends a new notification (within a session)
async function sendNotification({ receiverUserId, senderUserId, content }, session) {
    return await Notification.create([{ receiverUserId, senderUserId, content }], { session });
}

// creates new stock movement
async function createStockMovement(
    {
        productId,
        quantityChange,
        from,
        to,
        createdByUserId,
        notes,
        orderId, // optional
        returnId, // optional
        batchId, // optional
        warehouseAction, // optional
        isExecuted, // optional
        sourceLocation, // optional
        destinationLocation, // optional
        physicalExecutedAt, // optional
        physicalExecutedByUserId, // optional
    },
    session,
) {
    if (!session) {
        throw new Error("Session is required to create a stock movement");
    }

    const doc = {
        productId,
        quantityChange,
        from,
        to,
        createdByUserId,
        isExecuted: isExecuted ?? false,
    };

    if (notes != null) doc.notes = notes;

    // optional references, only set if provided
    if (orderId != null) doc.orderId = orderId;
    if (returnId != null) doc.returnId = returnId;
    if (batchId != null) doc.batchId = batchId;

    // optional warehouse/physical execution fields
    if (warehouseAction != null) doc.warehouseAction = warehouseAction;
    if (sourceLocation != null) doc.sourceLocation = sourceLocation;
    if (destinationLocation != null) doc.destinationLocation = destinationLocation;
    if (physicalExecutedAt != null) doc.physicalExecutedAt = physicalExecutedAt;
    if (physicalExecutedByUserId != null) doc.physicalExecutedByUserId = physicalExecutedByUserId;

    const [movement] = await StockMovement.create([doc], { session });
    return movement;
}

module.exports = {
    getNextDocumentNumber,
    sendNotification,
    createStockMovement,
};
