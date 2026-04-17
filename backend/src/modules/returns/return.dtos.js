const Joi = require("joi");
const { RETURN_STATUS } = require("../../enums/return.enums");

const objectId = Joi.string().hex().length(24);

const returnItemSchema = Joi.object({
    productId: objectId.required(),
    quantity: Joi.number().integer().min(1).required(),
}).unknown(false);

const returnDtos = {
    getReturnsQuerySchema: Joi.object({
        customerId: objectId.optional(),
    }),

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

    updateReturnStatusSchema: Joi.object({
        status: Joi.string().valid(RETURN_STATUS.FINALIZED, RETURN_STATUS.CANCELLED).required(),
    }),
};

module.exports = returnDtos;
