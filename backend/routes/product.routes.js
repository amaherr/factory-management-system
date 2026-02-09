const express = require("express");

const productController = require("../controllers/product.controller");
const productDtos = require("../dtos/product.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all active products (Public/Authenticated)
router.get("/", productController.getAllActiveProducts);

// Get all products (Admin, Planner)
router.get("/all", authorizor([ROLES.ADMIN, ROLES.PLANNER]), productController.getAllProducts);

// Create product (Admin, Planner)
router.post(
    "/",
    validator({ bodySchema: productDtos.createProductSchema }),
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.createProduct,
);

// Get products in stock (Authenticated)
router.get("/in-stock", productController.getProductsWithStock);

// Get products by location (Admin, Inventory)
router.get(
    "/location/:location",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.getProductsByLocation,
);

// Get product by id (Public/Authenticated)
router.get("/:id", productController.getProductById);

// Delete product (Admin, Planner)
router.delete("/:id", authorizor([ROLES.ADMIN, ROLES.PLANNER]), productController.deleteProduct);

// Update product (Admin, Planner)
router.put(
    "/:id",
    validator({ bodySchema: productDtos.createProductSchema }),
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.updateProduct,
);

// Change product activation (Admin, Planner)
router.patch(
    "/:productId/change-activation",
    validator({ bodySchema: productDtos.changeProductActivationSchema }),
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.changeProductActivation,
);

// Inventory - Transfer stock (Admin, Inventory)
router.patch(
    "/:productId/transfer",
    validator({ bodySchema: productDtos.transferProductStockSchema }),
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.transferProductStock,
);

// Inventory - Add stock (Admin, Inventory)
router.patch(
    "/:productId/add-stock",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.addProductStock,
);

// Inventory - Sell stock (Admin, Inventory)
router.patch(
    "/:id/sell",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productController.sellProduct,
);

// Inventory - Manual Adjustment (Admin, Inventory)
router.patch(
    "/:productId/manual-adjustment",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: productDtos.manualStockAdjustmentSchema }),
    productController.manualStockAdjustment,
);

module.exports = router;
