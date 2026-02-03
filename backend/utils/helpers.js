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

module.exports = { getNextDocumentNumber, isPositiveNumber, sendNotification };
