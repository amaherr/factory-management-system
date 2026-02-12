const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const batchDtos = {
    createBatchSchema: Joi.object({
        productId: objectId.required(),
        orderId: objectId.optional(),
        plannedQuantity: Joi.number().integer().min(1).required(),
        startDate: Joi.date().iso().optional(),
    }),

    updateBatchSchema: Joi.object({
        productId: objectId.optional(),
        orderId: objectId.allow(null).optional(), // allow null to clear orderId
        plannedQuantity: Joi.number().integer().min(0).optional(),
        startDate: Joi.date().iso().optional(),
    }).min(1), // require at least one field
};

module.exports = batchDtos;
