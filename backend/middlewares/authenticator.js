const jwt = require("jsonwebtoken");

const createError = require("../utils/errorFactory");
const User = require("../models/user.model");

// define public paths
PUBLIC_PATHS = ["/api/auth/login"];

// function that authenticates the token of the user
const authenticator = async (req, res, next) => {
    // allow public routes
    if (PUBLIC_PATHS.includes(req.path)) return next();

    // extract jwt token from cookie
    const token = req.cookies.token;
    if (!token) {
        return next(createError("Token missing", 401));
    }

    try {
        // decode the jwt token payload
        const JWT_SECRET = process.env.JWT_SECRET;
        const decodedPayload = jwt.verify(token, JWT_SECRET);

        // find the user by the id from the payload
        const currentUser = await User.findById(decodedPayload.id);
        if (!currentUser) {
            return next(createError("User doesn't exist", 401));
        }

        // add the user data to the request
        req.user = { id: decodedPayload.id, roles: decodedPayload.roles };
        console.log("User authenticated: \n", req.user);

        next();
    } catch (err) {
        return next(createError("Invalid token", 401));
    }
};

module.exports = authenticator;
