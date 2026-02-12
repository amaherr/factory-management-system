const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const returnItemSchema = Joi.object({
    productId: objectId.required(),
    quantity: Joi.number().integer().min(1).required(),
    unitPrice: Joi.number().min(0).required(),
}).unknown(false);

const returnDtos = {
    createReturnSchema: Joi.object({
        orderId: objectId.required(),
        note: Joi.string().trim().max(500).optional(),
        returnDate: Joi.date().iso().optional(),
        items: Joi.array().items(returnItemSchema).min(1).required(),
    }),

    updateReturnSchema: Joi.object({
        note: Joi.string().trim().max(200).optional(),
        returnDate: Joi.date().iso().optional(),
        items: Joi.array().items(returnItemSchema).min(1).optional(),
    }).min(1),
};

module.exports = returnDtos;
