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
                    quantity: Joi.number().integer().min(1).required(),
                }),
            )
            .min(1)
            .required(),
        discountAmount: Joi.number().min(0).required(),
        taxAmount: Joi.number().min(0).required(),
        notes: Joi.string().max(500).optional(),
    }),

    getOrdersQuerySchema: Joi.object({
        createdByUserId: objectId.optional(),
        customerId: objectId.optional(),
        orderType: Joi.string().trim().optional(),
        status: Joi.string().trim().optional(),
        from: Joi.date().iso().optional(),
        to: Joi.date()
            .iso()
            .min(Joi.ref("from")) // ensures to >= from if both exist
            .optional(),
        q: Joi.string().trim().optional(),
    }),

    getOrderQuerySchema: Joi.object({
        customerId: objectId.optional(),
        orderType: Joi.string().trim().optional(),
        status: Joi.string().trim().optional(),
        q: Joi.string().trim().optional(),
    }),

    changeOrderStatusSchema: Joi.object({
        status: Joi.string().valid(ORDER_STATUS.FINALIZED, ORDER_STATUS.CANCELLED).required(),
    }),
};

module.exports = orderDtos;
