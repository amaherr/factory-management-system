const createError = require("../utils/errorFactory");

// function to check if the role of the current user is allowed
const authorizor = (allowedRoles) => (req, res, next) => {
    try {
        const userRole = req.user.role;

        // check if role is not in array of allowed roles
        if (!allowedRoles.includes(userRole)) {
            return next(createError("Access denied", 403));
        }
        next();
    } catch (err) {
        next(createError(err, 500));
    }
};

module.exports = authorizor;
