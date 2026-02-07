const express = require("express");

const orderController = require("../controllers/order.controller");
const orderDtos = require("../dtos/order.dto");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// route to create a new order
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    validator({ bodySchema: orderDtos.createOrderSchema }),
    orderController.createOrder,
);

// route to get orders
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    validator({ querySchema: orderDtos.getOrdersQuerySchema }),
    orderController.getOrders,
);

// route to get orders made by user
router.get(
    "/me",
    validator({ querySchema: orderDtos.getOrderQuerySchema }),
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    orderController.getUserOrders,
);

// route to get a specific order
router.get(
    "/:orderId",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    orderController.getOrder,
);

// route to delete a order
router.delete("/:orderId", authorizor([ROLES.ADMIN]), orderController.deleteOrder);

module.exports = router;
