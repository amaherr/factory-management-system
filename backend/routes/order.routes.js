const express = require("express");

const orderController = require("../controllers/order.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// route to create a new order
router.post("/", authorizor([ROLES.ADMIN, ROLES.SALES]), orderController.createOrder);

// route to get orders
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    orderController.getOrders,
);

module.exports = router;
