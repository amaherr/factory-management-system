const Notification = require("./notification.model");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function getNotificationsByReceiverUserId(receiverUserId, tx = null) {
    const session = getMongoSession(tx);
    const query = Notification.find({ receiverUserId });
    if (session) {
        query.session(session);
    }
    return query;
}

async function getNotificationsBySenderUserId(senderUserId, tx = null) {
    const session = getMongoSession(tx);
    const query = Notification.find({ senderUserId });
    if (session) {
        query.session(session);
    }
    return query;
}

// Keep the same lookup/update shape currently used in service logic.
async function markNotificationAsReadForReceiver(data, tx = null) {
    const { notificationId, receiverUserId, status } = data;
    const session = getMongoSession(tx);
    const options = {
        new: true,
        runValidators: true,
    };
    if (session) {
        options.session = session;
    }

    return Notification.findByIdAndUpdate(
        { _id: notificationId, receiverUserId },
        { status },
        options,
    );
}

const notificationRepository = {
    getNotificationsByReceiverUserId,
    getNotificationsBySenderUserId,
    markNotificationAsReadForReceiver,
};

module.exports = notificationRepository;
