const Joi = require("joi");

const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../enums/stockMovement.enums");
const { FACTORY_LOCATIONS } = require("../enums/product.enums");

const objectId = Joi.string().hex().length(24);

const stockMovementDtos = {
    getStockMovementsQuerySchema: Joi.object({
        productId: objectId.optional(),
        q: Joi.string().trim().optional(), // search by product code
        fromType: Joi.string()
            .valid(...Object.values(STOCK_MOVEMENT_TYPE))
            .optional(),
        toType: Joi.string()
            .valid(...Object.values(STOCK_MOVEMENT_TYPE))
            .optional(),
        bucketType: Joi.string()
            .valid(...Object.values(STOCK_MOVEMENT_TYPE))
            .optional(),
        warehouseAction: Joi.string()
            .valid(...Object.values(WAREHOUSE_ACTIONS))
            .optional(),
        isExecuted: Joi.boolean().optional(),
        createdByUserId: objectId.optional(),
        physicalExecutedByUserId: objectId.optional(),
        createdFrom: Joi.date().iso().optional(),
        createdTo: Joi.date()
            .iso()
            .min(Joi.ref("createdFrom")) // ensures createdTo >= createdFrom if both exist
            .optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(false),

    executePickStockMovement: Joi.object({
        sourceLocation: Joi.string()
            .valid(...Object.values(FACTORY_LOCATIONS))
            .required(),
    }).unknown(false),

    executeReceiveStockMovement: Joi.object({
        destinationLocation: Joi.string()
            .valid(...Object.values(FACTORY_LOCATIONS))
            .required(),
    }).unknown(false),
};

module.exports = stockMovementDtos;
