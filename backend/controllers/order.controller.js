const Order = require("../models/order.model");
const { ORDER_TYPE } = require("../enums/order.enums");
const createError = require("../utils/errorFactory");

const orderController = {
    // function to create a new order
    createOrder: async (req, res, next) => {
        try {
            const { customerId, orderType, items, discountAmount, taxAmount, notes } = req.body;
            const userId = req.user.id;

            // create new order based on type
            if (orderType === ORDER_TYPE.ON_SHELF) {
            } else if (orderType === ORDER_TYPE.ON_DEMAND) {
            }
        } catch (err) {
            next(createError(err.message, 500));
        }
    },
};

module.exports = orderController;
