const express = require("express");
const multer = require("multer");

const productService = require("./product.service");
const productDtos = require("./product.dtos");

const validator = require("../../middlewares/validator");
const authorizor = require("../../middlewares/authorizor");
const { ROLES } = require("../../enums/user.enums");

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Get all active products (Public/Authenticated)
router.get("/", productService.getAllActiveProducts);

// Get all products (Admin, Planner)
router.get("/all", authorizor([ROLES.ADMIN, ROLES.PLANNING]), productService.getAllProducts);

// Create product (Admin, Planner)
router.post(
    "/",
    upload.single("image"),
    validator({ bodySchema: productDtos.createProductSchema }),
    authorizor([ROLES.ADMIN, ROLES.PLANNING]),
    productService.createProduct,
);

// Get products in stock (Authenticated)
router.get("/in-stock", productService.getProductsWithStock);

// Get products by location (Admin, Inventory)
router.get(
    "/location/:location",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productService.getProductsByLocation,
);

// Get product by id (Public/Authenticated)
router.get("/:id", productService.getProductById);

// Delete product (Admin, Planner)
router.delete("/:id", authorizor([ROLES.ADMIN, ROLES.PLANNING]), productService.deleteProduct);

// Update product (Admin, Planner)
router.put(
    "/:id",
    upload.single("image"),
    validator({ bodySchema: productDtos.updateProductSchema }),
    authorizor([ROLES.ADMIN, ROLES.PLANNING]),
    productService.updateProduct,
);

// Change product activation (Admin, Planner)
router.patch(
    "/:productId/change-activation",
    validator({ bodySchema: productDtos.changeProductActivationSchema }),
    authorizor([ROLES.ADMIN, ROLES.PLANNING]),
    productService.changeProductActivation,
);

// Inventory - Transfer stock (Admin, Inventory)
router.patch(
    "/:productId/transfer",
    validator({ bodySchema: productDtos.transferProductStockSchema }),
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    productService.transferProductStock,
);

// Inventory - Manual Phyisical Stock Adjustment (Admin, Inventory)
router.patch(
    "/:productId/manual-physical-adjustment",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: productDtos.manualPhysicalStockAdjustmentSchema }),
    productService.manualPhysicalStockAdjustment,
);

// Inventory - Set Physical Stock
router.patch(
    "/:productId/set-physical-stock",
    authorizor([ROLES.ADMIN]),
    validator({ bodySchema: productDtos.setPhysicalStockSchema }),
    productService.setPhysicalStock,
);

module.exports = router;
