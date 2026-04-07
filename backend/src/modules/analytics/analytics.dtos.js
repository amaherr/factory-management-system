const Joi = require("joi");

// Reusable date-range fields shared by all analytics endpoints
const dateRangeFields = {
    from: Joi.date().iso().optional(),
    to: Joi.date()
        .iso()
        .min(Joi.ref("from")) // ensures to >= from when both are provided
        .optional(),
};

const analyticsDtos = {
    dateRangeQuerySchema: Joi.object({
        ...dateRangeFields,
    }),

    salesQuerySchema: Joi.object({
        ...dateRangeFields,
        granularity: Joi.string().valid("day", "week", "month").default("day"),
    }),

    productionQuerySchema: Joi.object({
        ...dateRangeFields,
        granularity: Joi.string().valid("day", "month").default("month"),
    }),
};

module.exports = analyticsDtos;
