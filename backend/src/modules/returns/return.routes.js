const express = require("express");

const returnService = require("./return.service");
const returnDtos = require("./return.dtos");

const validator = require("../../middlewares/validator");
const authorizor = require("../../middlewares/authorizor");
const { ROLES } = require("../../enums/user.enums");

const router = express.Router();

// Get all returns (Admin, Sales, Accounting)
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    validator({ querySchema: returnDtos.getReturnsQuerySchema }),
    returnService.getAllReturns,
);

// Get returns by product ID (Admin, Sales, Accounting)
router.get(
    "/product/:productId",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    returnService.getReturnsByProductId,
);

// Get returns by order ID (Admin, Sales, Accounting)
router.get(
    "/order/:orderId",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
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
router.get(
    "/:returnId/invoice",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    returnService.downloadInvoice,
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
