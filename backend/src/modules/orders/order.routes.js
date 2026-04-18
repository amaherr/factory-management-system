const express = require("express");

const orderService = require("./order.service");
const orderDtos = require("./order.dtos");

const validator = require("../../middlewares/validator");
const authorizor = require("../../middlewares/authorizor");
const { ROLES } = require("../../enums/user.enums");

const router = express.Router();

// route to create a new order
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    validator({ bodySchema: orderDtos.createOrderSchema }),
    orderService.createOrder,
);

// route to get orders
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    validator({ querySchema: orderDtos.getOrdersQuerySchema }),
    orderService.getOrders,
);

// route to get orders made by user
router.get(
    "/me",
    validator({ querySchema: orderDtos.getOrderQuerySchema }),
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    orderService.getUserOrders,
);

// route to get a specific order
router.get(
    "/:orderId/invoice",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    orderService.downloadInvoice,
);

// route to get a specific order
router.get(
    "/:orderId",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    orderService.getOrder,
);

// route to change the status of a specific order
router.patch(
    "/change-status/:orderId",
    authorizor([ROLES.ADMIN, ROLES.ACCOUNTING]),
    validator({ bodySchema: orderDtos.changeOrderStatusSchema }),
    orderService.changeStatus,
);

// route to edit a specific order
router.patch(
    "/edit/:orderId",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    validator({ bodySchema: orderDtos.editOrderSchema }),
    orderService.editOrder,
);

// route to delete a order
router.delete("/:orderId", authorizor([ROLES.ADMIN]), orderService.deleteOrder);

module.exports = router;
