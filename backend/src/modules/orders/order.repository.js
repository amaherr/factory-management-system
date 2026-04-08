const Order = require("./order.model");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function getOrderById(orderId, tx = null) {
    const session = getMongoSession(tx);
    const query = Order.findById(orderId);
    if (session) {
        query.session(session);
    }
    return query;
}

const orderRepository = {
    getOrderById,
};

module.exports = orderRepository;