const joi = require("joi");

const createError = require("../utils/errorFactory");

// function to validate an incoming request against a schema
const validate =
    ({ bodySchema, querySchema }) =>
    (req, res, next) => {
        try {
            if (bodySchema) {
                // validate request body against request schema
                const { error, value } = schema.validate(req.body, {
                    stripUnknown: true,
                });
                if (error) {
                    return next(createError(error.details[0].message, 400));
                }

                req.body = value;
            }

            if (querySchema) {
                // validate request query against request schema
                const { error, value } = schema.validate(req.query, {
                    stripUnknown: true,
                });
                if (error) {
                    return next(createError(error.details[0].message, 400));
                }

                req.query = value;
            }

            next();
        } catch (err) {
            next(createError(err.message, 500));
        }
    };

module.exports = validate;
