const express = require("express");

const customerController = require("../controllers/customer.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// route to create a new customer
router.post("/", customerController.createCustomer);

module.exports = router;
