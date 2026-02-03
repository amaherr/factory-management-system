const Notification = require("../models/notification.model");
const StockMovement = require("../models/stockMovement.model");
const Counter = require("../models/counter.model");

// gets the next number of a document
async function getNextDocumentNumber(name, session) {
    const doc = await Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session },
    );
    return doc.seq;
}

// checks if a number is positive
function isPositiveNumber(n) {
    return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

// sends a new notification (within a session)
async function sendNotification({ receiverUserId, senderUserId, content }, session) {
    return await Notification.create({ receiverUserId, senderUserId, content }, { session });
}

// creates new stock movement
async function createStockMovement(
    { productId, quantityChange, movementType, notes, userId },
    session,
) {
    return await StockMovement.create(
        { productId, quantityChange, movementType, notes, userId },
        { session },
    );
}

module.exports = { getNextDocumentNumber, isPositiveNumber, sendNotification, createStockMovement };
