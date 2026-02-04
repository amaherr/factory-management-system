const express = require("express");

const inventoryController = require("../controllers/inventory.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all inventory items (Authenticated users - any role)
router.get("/", inventoryController.getAllInventory);

// Get all inventory items with stock (Authenticated users - any role)
router.get("/in-stock", inventoryController.getAllInventoryWithStock);

// Get inventory by location (Admin, Inventory)
router.get(
    "/location/:location",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.getInventoryByLocation
);

// Get inventory by product ID (Admin, Inventory)
router.get(
    "/product/:productId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.getInventoryByProductId
);

// Create inventory (Admin, Inventory)
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.createInventory
);

// Update inventory (Admin, Inventory)
router.put(
    "/:id",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.updateInventory
);

// Delete inventory (Admin)
router.delete(
    "/:id",
    authorizor([ROLES.ADMIN]),
    inventoryController.deleteInventory
);

// Transfer inventory between locations (Admin, Inventory)
router.patch(
    "/:id/transfer",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.transferInventory
);

// Add stock to inventory (Admin, Inventory)
router.patch(
    "/:id/add-stock",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.addStock
);

// Sell inventory (Admin, Inventory)
router.patch(
    "/:id/sell",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.sellInventory
);

// Manual Adjustment (Admin, Inventory)
router.patch(
    "/:id/manual-adjustment",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    inventoryController.manualAdjustment
);

module.exports = router;
