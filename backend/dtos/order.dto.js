const Joi = require("joi");

const { ORDER_TYPE, ORDER_STATUS } = require("../enums/order.enums");

const objectId = Joi.string().hex().length(24);

const orderDtos = {
    createOrderSchema: Joi.object({
        customerId: objectId.required(),
        orderType: Joi.string()
            .valid(...Object.values(ORDER_TYPE))
            .required(),
        items: Joi.array()
            .items(
                Joi.object({
                    productId: objectId.required(),
                    quantity: Joi.number().integer().min(0).required(),
                }),
            )
            .min(1)
            .required(),
        discountAmount: Joi.number().min(0).required(),
        taxAmount: Joi.number().min(0).required(),
        notes: Joi.string().max(500).optional(),
    }),
};

module.exports = orderDtos;
