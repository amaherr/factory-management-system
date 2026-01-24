const Customer = require("../models/customer.model");
const createError = require("../utils/errorFactory");

const customerController = {
    // function to create a new customer
    createCustomer: async (req, res, next) => {
        try {
            // check existing customer
            const existingCustomer = await Customer.findOne({ phoneNumber: req.body.phoneNumber });
            if (existingCustomer) {
                return next(createError("Customer already exists", 409));
            }

            // create new customer
            const customer = await Customer.create(req.body);

            res.status(201).json({
                success: true,
                message: "Successfully created a new customer",
                customer,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },
};

module.exports = customerController;
