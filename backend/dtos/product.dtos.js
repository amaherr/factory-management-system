const Joi = require("joi");

const { COLORS, FACTORY_LOCATIONS, PRODUCT_STATUS, SEASONS } = require("../enums/product.enums");
const { setPhysicalStock } = require("../controllers/product.controller");

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
        defaultImage: Joi.string().trim().optional(),
        sku: Joi.number().integer().min(1).required(),
        costPrice: Joi.number().min(1).optional(),
        salePrice: Joi.number().min(1).required(),
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
        costPrice: Joi.number().min(1).optional(),
        salePrice: Joi.number().min(1).optional(),
        removeImage: Joi.boolean().truthy("true").falsy("false").optional(),
    }).min(1),

    changeProductActivationSchema: Joi.object({
        status: Joi.string().valid(PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.DEACTIVE).required(),
    }),

    transferProductStockSchema: Joi.object({
        fromLocation: Joi.string()
            .valid(...Object.values(FACTORY_LOCATIONS))
            .required(),
        toLocation: Joi.string()
            .valid(...Object.values(FACTORY_LOCATIONS))
            .invalid(Joi.ref("fromLocation")) // cannot be same as fromLocation
            .required(),
        quantity: Joi.number()
            .integer()
            .greater(0) // > 0
            .required(),
    }),

    manualPhysicalStockAdjustmentSchema: Joi.object({
        location: Joi.string()
            .valid(...Object.values(FACTORY_LOCATIONS))
            .required(),
        adjustmentType: Joi.string().valid("add", "subtract").required(),
        quantity: Joi.number()
            .integer()
            .greater(0) // must be > 0
            .required(),
    }),

    setPhysicalStockSchema: Joi.object({
        location: Joi.string()
            .valid(...Object.values(FACTORY_LOCATIONS))
            .required(),
        newQuantity: Joi.number().integer().min(0).required(),
    }),
};

module.exports = productDtos;
