const express = require("express");

const stockMovementService = require("./stockMovement.service");
const stockMovementDtos = require("./stockMovement.dtos");

const validator = require("../../middlewares/validator");
const authorizor = require("../../middlewares/authorizor");
const { ROLES } = require("../../enums/user.enums");

const router = express.Router();

// Get all stock movements (Admin, Inventory, Accounting)
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    validator({ querySchema: stockMovementDtos.getStockMovementsQuerySchema }),
    stockMovementService.getStockMovements,
);

// Get stock movements for a specific product (Admin, Inventory, Accounting)
router.get(
    "/product/:productId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    stockMovementService.getProductStockMovements,
);

// Get a specific stock movement (Admin, Inventory, Accounting)
router.get(
    "/:movementId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    stockMovementService.getStockMovement,
);

// Execute a specific stock movement pick action (Admin, Inventory)
router.patch(
    "/:movementId/pick",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: stockMovementDtos.executePickStockMovement }),
    stockMovementService.executePickStockMovement,
);

// Execute a specific stock movement receive action (Admin, Inventory)
router.patch(
    "/:movementId/receive",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: stockMovementDtos.executeReceiveStockMovement }),
    stockMovementService.executeReceiveStockMovement,
);

module.exports = router;
