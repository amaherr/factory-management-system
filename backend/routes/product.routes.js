const express = require("express");

const productController = require("../controllers/product.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// route to create a new product
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.PLANNER]),
    productController.createProduct
);

module.exports = router;
