const express = require("express");

const productController = require("../controllers/product.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all active products (Public/Authenticated)
router.get(
    "/",
    productController.getAllActiveProducts
);

// Get all products (Admin, Planner)
router.get(
    "/all",
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.getAllProducts
);

// Create product (Admin, Planner)
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.createProduct
);

// Get products in stock (Authenticated)
router.get(
    "/in-stock",
    productController.getProductsWithStock
);

// Get products by location (Admin, Inventory)
router.get(
    "/location/:location",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.getProductsByLocation
);

// Get product by id (Public/Authenticated)
router.get(
    "/:id",
    productController.getProductById
);

// Delete product (Admin, Planner)
router.delete(
    "/:id",
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.deleteProduct
);

// Update product (Admin, Planner)
router.put(
    "/:id",
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.updateProduct
);

// Activate product (Admin, Planner)
router.patch(
    "/:id/active",
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.activateProduct
);

// Deactivate product (Admin, Planner)
router.patch(
    "/:id/deactive",
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.deactivateProduct
);

// Inventory - Transfer stock (Admin, Inventory)
router.patch(
    "/:id/transfer",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.transferProductStock
);

// Inventory - Add stock (Admin, Inventory)
router.patch(
    "/:id/add-stock",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.addProductStock
);

// Inventory - Sell stock (Admin, Inventory)
router.patch(
    "/:id/sell",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.sellProduct
);

// Inventory - Manual Adjustment (Admin, Inventory)
router.patch(
    "/:id/manual-adjustment",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.manualStockAdjustment
);

module.exports = router;
