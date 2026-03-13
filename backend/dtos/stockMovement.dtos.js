const Joi = require("joi");

const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../enums/stockMovement.enums");

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
        movementType: Joi.string()
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
    }).unknown(true), // allow unknown query params
};

module.exports = stockMovementDtos;
