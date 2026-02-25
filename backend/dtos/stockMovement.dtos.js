const Joi = require("joi");

const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");

const objectId = Joi.string().hex().length(24);

const stockMovementDtos = {
    getStockMovementsQuerySchema: Joi.object({
        productId: objectId.optional(),
        q: Joi.string().trim().optional(), // search by product code
        movementType: Joi.string()
            .valid(...Object.values(STOCK_MOVEMENT_TYPE))
            .optional(),
        from: Joi.date().iso().optional(),
        to: Joi.date()
            .iso()
            .min(Joi.ref("from")) // ensures to >= from if both exist
            .optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).max(100).optional(),
    }).unknown(true), // allow unknown query params
};

module.exports = stockMovementDtos;
