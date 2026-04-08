const Order = require("./order.model");
const { ORDER_STATUS } = require("../../enums/order.enums");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function getOrderById(orderId, tx = null) {
    const session = getMongoSession(tx);
    const query = Order.findById(orderId);
    if (session) {
        query.session(session);
    }
    return query;
}

async function createOrder(data, tx = null) {
    const session = getMongoSession(tx);
    const [order] = await Order.create([data], { session });
    return order;
}

async function getOrders(data, tx = null) {
    const { filter } = data;
    const session = getMongoSession(tx);
    const query = Order.find(filter)
        .populate("customerId")
        .populate("items.productId", "name productCode")
        .sort({ createdAt: -1 });
    if (session) {
        query.session(session);
    }
    return query;
}

async function getUserOrders(data, tx = null) {
    const { userId, filter } = data;
    const session = getMongoSession(tx);
    const query = Order.find({ ...filter, createdByUserId: userId })
        .populate("customerId")
        .populate("items.productId", "name productCode")
        .sort("-createdAt");
    if (session) {
        query.session(session);
    }
    return query;
}

async function getOrderWithDetails(orderId, tx = null) {
    const session = getMongoSession(tx);
    const query = Order.findById(orderId)
        .populate("createdByUserId customerId finalizedByUserId cancelledByUserId")
        .populate("items.productId", "name productCode");
    if (session) {
        query.session(session);
    }
    return query;
}

async function updateDraftOrderStatus(data, tx = null) {
    const { orderId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = { new: true };
    if (session) {
        options.session = session;
    }

    return Order.findOneAndUpdate(
        { _id: orderId, status: ORDER_STATUS.DRAFT },
        updateObject,
        options,
    );
}

async function updateOrderById(data, tx = null) {
    const { orderId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = { new: true };
    if (session) {
        options.session = session;
    }

    return Order.findByIdAndUpdate(orderId, updateObject, options);
}

async function deleteOrderById(orderId, tx = null) {
    const session = getMongoSession(tx);
    const options = {};
    if (session) {
        options.session = session;
    }
    return Order.findByIdAndDelete(orderId, options);
}

const orderRepository = {
    getOrderById,
    createOrder,
    getOrders,
    getUserOrders,
    getOrderWithDetails,
    updateDraftOrderStatus,
    updateOrderById,
    deleteOrderById,
};

module.exports = orderRepository;
