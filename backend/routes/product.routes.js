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

module.exports = router;
