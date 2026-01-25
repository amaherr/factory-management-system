const express = require("express");

const customerController = require("../controllers/customer.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

router.use(authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]));

// route to create a new customer
router.post("/", customerController.createCustomer);

// route to get all customers
router.get("/", customerController.getAllCustomers);

// route to get a specific customers
router.get("/:customerId", customerController.getCustomer);

// route to edit a specific customer
router.patch("/edit/:customerId", customerController.editCustomer);

// route to delete a specific customer
router.delete("/delete/:customerId", customerController.deleteCustomer);

module.exports = router;
