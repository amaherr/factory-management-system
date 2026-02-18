const Customer = require("../models/customer.model");

const response = require("../utils/responseFactory");
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

            res.status(201).json(response("Successfully created a new customer", customer));
        } catch (err) {
            return next(err);
        }
    },

    // function to retrieve customers
    getCustomers: async (req, res, next) => {
        try {
            const { search } = req.query;

            // build filter object
            let filter = {};
            if (search) {
                filter = {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { phoneNumber: { $regex: search, $options: 'i' } },
                    ],
                };
            }

            const customers = await Customer.find(filter);

            res.status(200).json(response("Customers retrieved successfully", customers));
        } catch (err) {
            return next(err);
        }
    },

    // function to retrieve a specific customers
    getCustomer: async (req, res, next) => {
        try {
            const customerId = req.params.customerId;

            const customer = await Customer.findById(customerId);
            if (!customer) {
                return next(createError("Customer not found", 404));
            }

            res.status(200).json(response("Customer retrieved successfully", customer));
        } catch (err) {
            return next(err);
        }
    },

    // function to edit a specific customer
    editCustomer: async (req, res, next) => {
        try {
            const customerId = req.params.customerId;

            // update customer
            const updatedCustomer = await Customer.findByIdAndUpdate(
                customerId,
                { $set: req.body },
                {
                    new: true,
                    runValidators: true,
                },
            );
            if (!updatedCustomer) {
                return next(createError("Customer not found", 404));
            }

            res.status(200).json(response("Customer updated successfully", updatedCustomer));
        } catch (err) {
            if (err.code === 11000 && err.keyPattern?.phoneNumber) {
                return next(createError("Phone number already exists", 409));
            }

            return next(err);
        }
    },

    // function to delete a specific customer
    deleteCustomer: async (req, res, next) => {
        try {
            const customerId = req.params.customerId;

            // delete customer
            const deletedCustomer = await Customer.findByIdAndDelete(customerId);
            if (!deletedCustomer) {
                return next(createError("Customer not found", 404));
            }

            res.status(200).json(response("Successfully deleted customer", deletedCustomer));
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = customerController;
