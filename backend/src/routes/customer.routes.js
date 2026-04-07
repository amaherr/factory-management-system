const express = require("express");

const customerService = require("../services/customer.service");
const customerDtos = require("../dtos/customer.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

router.use(authorizor([ROLES.ADMIN, ROLES.SALES, ROLES.ACCOUNTING]));

// route to create a new customer
router.post(
    "/",
    validator({ bodySchema: customerDtos.createCustomerSchema }),
    customerService.createCustomer,
);

// route to get all customers
router.get(
    "/",
    validator({ querySchema: customerDtos.getCustomersSchema }),
    customerService.getCustomers,
);

// route to get a specific customers
router.get("/:customerId", customerService.getCustomer);

// route to edit a specific customer
router.patch(
    "/edit/:customerId",
    validator({ bodySchema: customerDtos.editCustomerSchema }),
    customerService.editCustomer,
);

// route to delete a specific customer
router.delete("/delete/:customerId", customerService.deleteCustomer);

module.exports = router;
