const express = require("express");

const stockMovementController = require("../controllers/stockMovement.controller");
const stockMovementDtos = require("../dtos/stockMovement.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all stock movements (Admin, Inventory, Accounting)
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    validator({ querySchema: stockMovementDtos.getStockMovementsQuerySchema }),
    stockMovementController.getStockMovements,
);

// Get stock movements for a specific product (Admin, Inventory, Accounting)
router.get(
    "/product/:productId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    stockMovementController.getProductStockMovements,
);

// Get a specific stock movement (Admin, Inventory, Accounting)
router.get(
    "/:movementId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    stockMovementController.getStockMovement,
);

// Execute a specific stock movement pick action (Admin, Inventory)
router.patch(
    "/:movementId/pick",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: stockMovementDtos.executePickStockMovement }),
    stockMovementController.executePickStockMovement,
);

// Execute a specific stock movement receive action (Admin, Inventory)
router.patch(
    "/:movementId/receive",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: stockMovementDtos.executeReceiveStockMovement }),
    stockMovementController.executeReceiveStockMovement,
);

module.exports = router;
