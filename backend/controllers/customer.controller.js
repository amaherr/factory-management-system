const Customer = require("../models/customer.model");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
            const { search, page = 1, limit = 20 } = req.query;

            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
            const skip = (pageNum - 1) * limitNum;

            // build filter object
            let filter = {};
            if (search) {
                const escapedSearch = escapeRegex(search.trim());
                filter = {
                    $or: [
                        { name: { $regex: escapedSearch, $options: "i" } },
                        { phoneNumber: { $regex: escapedSearch, $options: "i" } },
                    ],
                };
            }

            const [total, customers] = await Promise.all([
                Customer.countDocuments(filter),
                Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            ]);

            const pages = Math.ceil(total / limitNum);

            res.status(200).json(
                response("Customers retrieved successfully", {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages,
                    customers,
                }),
            );
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
