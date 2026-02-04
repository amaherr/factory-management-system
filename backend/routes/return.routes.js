const express = require("express");

const returnController = require("../controllers/return.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all returns (Admin, Inventory, Sales)
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.SALES]),
    returnController.getAllReturns
);

// Get returns by product ID (Admin, Inventory, Sales)
router.get(
    "/product/:productId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.SALES]),
    returnController.getReturnsByProductId
);

// Create return (Admin, Sales)
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    returnController.createReturn
);

// Update return (Admin, Sales)
router.put(
    "/:id",
    authorizor([ROLES.ADMIN, ROLES.SALES]),
    returnController.updateReturn
);

// Delete return (Admin only)
router.delete(
    "/:id",
    authorizor([ROLES.ADMIN]),
    returnController.deleteReturn
);

module.exports = router;
