const createError = require("../utils/errorFactory");

// function to check if one of the roles of the current user is allowed
const authorizor = (allowedRoles) => (req, res, next) => {
    try {
        const userRoles = req.user.roles;

        // check if atleast one role is in the array of allowed roles
        const isAuthorized = userRoles.some((role) => allowedRoles.includes(role));
        if (!isAuthorized) {
            return next(createError("Access denied", 403));
        }

        next();
    } catch (err) {
        return next(err);
    }
};

module.exports = authorizor;
