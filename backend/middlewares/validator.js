const createError = require("../utils/errorFactory");

// function to validate an incoming request against a schema
const validator =
    ({ bodySchema, querySchema }) =>
    (req, res, next) => {
        try {
            if (bodySchema) {
                // validate request body against request body schema
                const { error, value } = bodySchema.validate(req.body, {
                    stripUnknown: true,
                });
                if (error) {
                    return next(createError(error.details[0].message, 400));
                }

                req.body = value;
            }

            if (querySchema) {
                // validate request query against request query schema
                const { error, value } = querySchema.validate(req.query, {
                    stripUnknown: true,
                });
                if (error) {
                    return next(createError(error.details[0].message, 400));
                }

                req.query = value;
            }

            next();
        } catch (err) {
            next(err);
        }
    };

module.exports = validator;
