const express = require("express");

const customerController = require("../controllers/customer.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// route to create a new customer
router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    customerController.createCustomer,
);

// route to get all customers
router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    customerController.getAllCustomers,
);

// route to get a specific customers
router.get(
    "/:customerId",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    customerController.getCustomer,
);

// route to edit a specific customer
router.patch("/edit/:customerId", customerController.editCustomer);

// route to delete a specific customer
router.delete(
    "/delete/:customerId",
    authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]),
    customerController.deleteCustomer,
);

module.exports = router;
