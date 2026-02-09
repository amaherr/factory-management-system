const Joi = require("joi");
const { editCustomer } = require("../controllers/customer.controller");

const customerDtos = {
    createCustomerSchema: Joi.object({
        name: Joi.string().trim().min(1).max(35).required(),
        company: Joi.string().trim().min(1).optional(),
        phoneNumber: Joi.string().trim().min(5).max(20).required(),
        address: Joi.object({
            country: Joi.string().trim().min(1).max(35).required(),
            governate: Joi.string().trim().min(1).max(35).required(),
            city: Joi.string().trim().min(1).max(35).required(),
            street: Joi.string().trim().min(1).required(),
        })
            .unknown(false)
            .required(),
    }),

    editCustomerSchema: Joi.object({
        name: Joi.string().trim().min(1).max(35).optional(),
        company: Joi.string().trim().min(1).optional(),
        phoneNumber: Joi.string().trim().min(5).max(20).optional(),
        address: Joi.object({
            country: Joi.string().trim().min(1).max(35).optional(),
            governate: Joi.string().trim().min(1).max(35).optional(),
            city: Joi.string().trim().min(1).max(35).optional(),
            street: Joi.string().trim().min(1).optional(),
        })
            .unknown(false)
            .optional(),
    })
        .unknown(false)
        .min(1),
};

module.exports = customerDtos;
