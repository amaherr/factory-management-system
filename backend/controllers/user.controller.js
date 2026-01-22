const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const User = require("../models/user.model");
const createError = require("../utils/errorFactory");

const userController = {
    // function to handle user login
    login: async (req, res, next) => {
        try {
            const { phoneNumber, password } = req.body;

            // find user by phoneNumber (override password's 'select: false')
            const user = await User.findOne({ phoneNumber }).select("+password");
            if (!user) {
                return next(createError("Invalid Phone Number or password", 401));
            }

            // compare both passwords
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return next(createError("Invalid Phone Number or password", 401));
            }

            // create jwt token
            const JWT_SECRET = process.env.JWT_SECRET;
            const sevenDays = 7 * 24 * 60 * 60 * 1000; // time in milliseconds
            const token = jwt.sign(
                {
                    id: user._id,
                    roles: user.roles,
                },
                JWT_SECRET,
                {
                    expiresIn: `${sevenDays}`,
                },
            );

            // remove password when returning the user
            const userObj = user.toObject();
            delete userObj.password;

            // sent the jwt token in a cookie
            const isProduction = process.env.NODE_ENV == "development" ? false : true;
            res.status(200)
                .cookie("token", token, {
                    maxAge: sevenDays,
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? "none" : "lax",
                })
                .json({
                    success: true,
                    message: "User logged in successfully",
                    user: userObj,
                });
        } catch (err) {
            next(createError(err, 500));
        }
    },

    // function to create a new user
    createUser: async (req, res, next) => {
        try {
            const { name, password, roles, phoneNumber } = req.body;

            // check if user already exists
            const existingUser = await User.findOne({ phoneNumber });
            if (existingUser) {
                return next(createError("User already exists", 400));
            }

            // hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // create new user
            const user = await User.create({
                name,
                password: hashedPassword,
                roles,
                phoneNumber,
            });

            res.status(201).json({
                success: true,
                message: "User created successfully",
                user,
            });
        } catch (err) {
            next(createError(err, 500));
        }
    },
};

module.exports = userController;
