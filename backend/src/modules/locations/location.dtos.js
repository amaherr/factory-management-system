const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const locationDtos = {
    createLocationSchema: Joi.object({
        name: Joi.string().trim().min(1).max(100).required(),
        code: Joi.string().trim().min(1).max(50).optional(),
        notes: Joi.string().trim().max(300).optional(),
        isActive: Joi.boolean().optional(),
    }),

    updateLocationSchema: Joi.object({
        name: Joi.string().trim().min(1).max(100).optional(),
        code: Joi.string().trim().min(1).max(50).optional(),
        notes: Joi.string().trim().max(300).optional(),
        isActive: Joi.boolean().optional(),
    }).min(1),

    createSectionSchema: Joi.object({
        name: Joi.string().trim().min(1).max(100).required(),
        code: Joi.string().trim().min(1).max(50).optional(),
        notes: Joi.string().trim().max(300).optional(),
        isActive: Joi.boolean().optional(),
    }),

    updateSectionSchema: Joi.object({
        name: Joi.string().trim().min(1).max(100).optional(),
        code: Joi.string().trim().min(1).max(50).optional(),
        notes: Joi.string().trim().max(300).optional(),
        isActive: Joi.boolean().optional(),
    }).min(1),

    objectIdSchema: objectId,
};

module.exports = locationDtos;
