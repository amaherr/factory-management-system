const express = require("express");

const returnService = require("../services/return.service");
const returnDtos = require("../dtos/return.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all returns (Admin, Inventory, Sales)
router.get("/", authorizor([ROLES.ADMIN, ROLES.SALES]), returnService.getAllReturns);

// Get returns by product ID (Admin, Inventory, Sales)
router.get(
    "/product/:productId",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    returnService.getReturnsByProductId,
);

// Get returns by order ID (Admin, Inventory, Sales)
router.get(
    "/order/:orderId",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    returnService.getReturnsByOrderId,
);

// Create return (Admin, Sales)
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    validator({ bodySchema: returnDtos.createReturnSchema }),
    returnService.createReturn,
);

// Edit return (Admin, Sales)
router.put(
    "/:returnId",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    validator({ bodySchema: returnDtos.updateReturnSchema }),
    returnService.editReturn,
);

// Update return status (Admin, Accountin)
router.patch(
    "/:returnId/status",
    authorizor([ROLES.ADMIN, ROLES.ACCOUNTING]),
    validator({ bodySchema: returnDtos.updateReturnStatusSchema }),
    returnService.updateReturnStatus,
);

// Delete return (Admin only)
router.delete("/:returnId", authorizor([ROLES.ADMIN]), returnService.deleteReturn);

module.exports = router;
