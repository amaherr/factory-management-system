const Joi = require("joi");

const { COLORS, FACTORY_LOCATIONS, PRODUCT_STATUS, SEASONS } = require("../enums/product.enums");

const objectId = Joi.string().hex().length(24);

const productDtos = {
    createProductSchema: Joi.object({
        code: Joi.string().trim().min(1).max(50).required(),
        name: Joi.string().trim().min(1).max(200).required(),
        description: Joi.string().trim().max(2000).optional(),
        color: Joi.string()
            .valid(...Object.values(COLORS))
            .required(),
        season: Joi.string()
            .valid(...Object.values(SEASONS))
            .optional(),
        defaultImage: Joi.string().trim().uri().optional(),
        sku: Joi.number().integer().min(1).required(),
        costPrice: Joi.number().min(1).optional(),
        salePrice: Joi.number().min(1).required(),
    }),
};

module.exports = productDtos;
