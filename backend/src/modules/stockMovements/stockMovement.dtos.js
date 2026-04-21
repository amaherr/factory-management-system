const Joi = require("joi");

const {
    STOCK_MOVEMENT_TYPE,
    WAREHOUSE_ACTIONS,
    EXECUTION_STATUS,
} = require("../../enums/stockMovement.enums");

const objectId = Joi.string().hex().length(24);
const allocationSchema = Joi.object({
    location: Joi.string().trim().min(1).required(),
    section: Joi.string().trim().min(1).required(),
    quantity: Joi.number().integer().min(1).required(),
}).unknown(false);

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
        executionStatus: Joi.alternatives()
            .try(
                Joi.string().valid(...Object.values(EXECUTION_STATUS)),
                Joi.string().pattern(
                    /^(not_executed|partially_executed|executed)(,(not_executed|partially_executed|executed))*$/,
                ),
            )
            .optional(),
        createdByUserId: objectId.optional(),
        physicalExecutedByUserId: objectId.optional(),
        createdFrom: Joi.date().iso().optional(),
        createdTo: Joi.date()
            .iso()
            .min(Joi.ref("createdFrom")) // ensures createdTo >= createdFrom if both exist
            .optional(),
        page: Joi.number().integer().min(1).optional(),
        limit: Joi.number().integer().min(1).optional(),
    }).unknown(false),

    executePickStockMovement: Joi.object({
        sourceAllocations: Joi.array().items(allocationSchema).min(1).required(),
    }).unknown(false),

    executeReceiveStockMovement: Joi.object({
        destinationAllocations: Joi.array().items(allocationSchema).min(1).required(),
    }).unknown(false),
};

module.exports = stockMovementDtos;
