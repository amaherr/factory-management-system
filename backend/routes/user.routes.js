const express = require("express");

const userController = require("../controllers/user.controller");
const authorizor = require("../middlewares/authorizor");
const ROLES = require("../enums/roles.enum");

const router = express.Router();

// public login route
router.post("/login", userController.login);

// apply authorizor middleware (admin routes)
router.use(authorizor([ROLES.ADMIN]));

// route to create a new user
router.post("/", userController.createUser);

module.exports = router;
