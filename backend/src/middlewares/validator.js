const createError = require("../utils/errorFactory");

// function to validate an incoming request against a schema
const validator =
    ({ bodySchema, querySchema, paramsSchema }) =>
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

            if (paramsSchema) {
                // validate request params against request params schema
                const { error, value } = paramsSchema.validate(req.params, {
                    stripUnknown: true,
                });
                if (error) {
                    return next(createError(error.details[0].message, 400));
                }

                req.params = value;
            }

            next();
        } catch (err) {
            return next(err);
        }
    };

module.exports = validator;
