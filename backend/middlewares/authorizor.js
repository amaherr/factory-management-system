const createError = require("../utils/errorFactory");

// function to check if one of the roles of the current user is allowed
const authorizor = (allowedRoles) => (req, res, next) => {
    try {
        const userRoles = req.user.roles;

        // check if atleast one role is in the array of allowed roles
        userRoles.forEach((role) => {
            if (allowedRoles.includes(role)) {
                console.log("User authorized");
                return next();
            }
        });

        // no user role is in allowed roles
        next(createError("Access denied", 403));
    } catch (err) {
        next(createError(err, 500));
    }
};

module.exports = authorizor;
