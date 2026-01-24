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

    // function to retrieve all customers
    getAllCustomers: async (req, res, next) => {
        try {
            const customers = await Customer.find();

            res.status(200).json({
                success: true,
                message: "Customers retrieved successfully",
                customers,
            });
        } catch (err) {
            next(createError(err.message, 500));
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

            res.status(200).json({
                success: true,
                message: "Customer retrieved successfully",
                customer,
            });
        } catch (err) {
            next(createError(err.message, 500));
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

            res.status(200).json({
                success: true,
                message: "Successfully deleted customer",
                deletedCustomer,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },
};

module.exports = customerController;
