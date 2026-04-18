const Joi = require("joi");

const { ORDER_TYPE, ORDER_STATUS } = require("../../enums/order.enums");

const objectId = Joi.string().hex().length(24);

const orderDtos = {
    createOrderSchema: Joi.object({
        customerId: objectId.required(),
        items: Joi.array()
            .items(
                Joi.object({
                    productId: objectId.required(),
                    quantity: Joi.number().integer().min(1).required(),
                    itemType: Joi.string()
                        .valid(...Object.values(ORDER_TYPE))
                        .required(),
                }).unknown(false),
            )
            .min(1)
            .required(),
        discountAmount: Joi.number().min(0).required(),
        taxAmount: Joi.number().min(0).required(),
        notes: Joi.string().max(200).optional(),
    }),

    getOrdersQuerySchema: Joi.object({
        createdByUserId: objectId.optional(),
        customerId: objectId.optional(),
        status: Joi.string().trim().optional(),
        from: Joi.date().iso().optional(),
        to: Joi.date()
            .iso()
            .min(Joi.ref("from")) // ensures to >= from if both exist
            .optional(),
        q: Joi.string().trim().optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
    }),

    getOrderQuerySchema: Joi.object({
        customerId: objectId.optional(),
        status: Joi.string().trim().optional(),
        q: Joi.string().trim().optional(),
    }),

    changeOrderStatusSchema: Joi.object({
        status: Joi.string().valid(ORDER_STATUS.FINALIZED, ORDER_STATUS.CANCELLED).required(),
    }),

    editOrderSchema: Joi.object({
        customerId: objectId.optional(),
        items: Joi.array()
            .items(
                Joi.object({
                    productId: objectId.required(),
                    quantity: Joi.number().integer().min(1).required(),
                }).unknown(false),
            )
            .min(1)
            .optional(),
        discountAmount: Joi.number().min(0).optional(),
        taxAmount: Joi.number().min(0).optional(),
        notes: Joi.string().max(200).optional(),
    }).min(1), // require at least one field to be present
};

module.exports = orderDtos;
