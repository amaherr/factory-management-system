const Joi = require("joi");

const { COLORS, PRODUCT_STATUS, SEASONS } = require("../../enums/product.enums");

const productDtos = {
    listProductsQuerySchema: Joi.object({
        q: Joi.string().trim().optional(),
        color: Joi.string()
            .valid(...Object.values(COLORS))
            .optional(),
        season: Joi.string()
            .valid(...Object.values(SEASONS))
            .optional(),
        status: Joi.string()
            .valid(...Object.values(PRODUCT_STATUS))
            .optional(),
        inStock: Joi.boolean().optional(),
        location: Joi.string().trim().min(1).optional(),
        section: Joi.string().trim().min(1).optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
    }).unknown(false),

    locationParamsSchema: Joi.object({
        location: Joi.string().trim().min(1).required(),
    }).unknown(false),

    locationSectionParamsSchema: Joi.object({
        location: Joi.string().trim().min(1).required(),
        section: Joi.string().trim().min(1).required(),
    }).unknown(false),

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
        defaultImage: Joi.string().trim().optional(),
        sku: Joi.number().integer().min(1).required(),
        unitCostPrice: Joi.number().min(1).optional(),
        unitSalePrice: Joi.number().min(1).required(),
    }),

    updateProductSchema: Joi.object({
        code: Joi.string().trim().min(1).max(50).optional(),
        name: Joi.string().trim().min(1).max(200).optional(),
        description: Joi.string().trim().min(1).max(2000).optional(),
        color: Joi.string()
            .valid(...Object.values(COLORS))
            .optional(),
        season: Joi.string()
            .valid(...Object.values(SEASONS))
            .optional(),
        defaultImage: Joi.string().trim().optional(),
        sku: Joi.number().integer().min(1).optional(),
        unitCostPrice: Joi.number().min(1).optional(),
        unitSalePrice: Joi.number().min(1).optional(),
        removeImage: Joi.boolean().truthy("true").falsy("false").optional(),
    }).min(1),

    changeProductActivationSchema: Joi.object({
        status: Joi.string().valid(PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.DEACTIVE).required(),
    }),

    manualPhysicalStockAdjustmentSchema: Joi.object({
        location: Joi.string().trim().min(1).required(),
        section: Joi.string().trim().min(1).required(),
        adjustmentType: Joi.string().valid("add", "subtract").required(),
        quantity: Joi.number()
            .integer()
            .greater(0) // must be > 0
            .required(),
    }),

    setPhysicalStockSchema: Joi.object({
        location: Joi.string().trim().min(1).required(),
        section: Joi.string().trim().min(1).required(),
        newQuantity: Joi.number().integer().min(0).required(),
    }),
};

module.exports = productDtos;
