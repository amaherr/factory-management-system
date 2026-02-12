const express = require("express");

const returnController = require("../controllers/return.controller");
const returnDtos = require("../dtos/return.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all returns (Admin, Inventory, Sales)
router.get("/", authorizor([ROLES.ADMIN, ROLES.SALES]), returnController.getAllReturns);

// Get returns by product ID (Admin, Inventory, Sales)
router.get(
    "/product/:productId",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    returnController.getReturnsByProductId,
);

// Get returns by order ID (Admin, Inventory, Sales)
router.get(
    "/order/:orderId",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    returnController.getReturnsByOrderId,
);

// Create return (Admin, Sales)
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    validator({ bodySchema: returnDtos.createReturnSchema }),
    returnController.createReturn,
);

// Update return (Admin, Sales)
router.put(
    "/:id",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    validator({ bodySchema: returnDtos.updateReturnSchema }),
    returnController.updateReturn,
);

// Delete return (Admin only)
router.delete("/:id", authorizor([ROLES.ADMIN]), returnController.deleteReturn);

module.exports = router;
