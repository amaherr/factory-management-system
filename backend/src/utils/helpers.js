const Notification = require("../modules/notifications/notification.model");
const Counter = require("./counter.model");

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

module.exports = {
    getNextDocumentNumber,
    sendNotification,
};
