const Joi = require("joi");

const { ROLES } = require("../enums/user.enums");

const userDtos = {
    loginSchema: Joi.object({
        phoneNumber: Joi.string().trim().max(20).required(),
        password: Joi.string().required(),
    }),

    createUserSchema: Joi.object({
        name: Joi.string().trim().min(1).max(35).required(),
        phoneNumber: Joi.string().trim().min(5).max(20).required(),
        password: Joi.string().min(6).required(),
        roles: Joi.array()
            .items(Joi.string().valid(...Object.values(ROLES)))
            .min(1)
            .required(),
    }),

    editUserSchema: Joi.object({
        name: Joi.string().trim().min(1).max(35).optional(),
        phoneNumber: Joi.string().trim().min(5).max(20).optional(),
        password: Joi.string().min(6).optional(),
    }).min(1),

    changeUserRolesSchema: Joi.object({
        newRoles: Joi.array()
            .items(Joi.string().valid(...Object.values(ROLES)))
            .min(1)
            .required(),
    }),

    changeUserActivationSchema: Joi.object({
        isActive: Joi.boolean().required(),
    }),
};

module.exports = userDtos;
