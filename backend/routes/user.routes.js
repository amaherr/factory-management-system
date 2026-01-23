const express = require("express");

const userController = require("../controllers/user.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// public login route
router.post("/login", userController.login);

// apply authorizor middleware (admin routes)
router.use(authorizor([ROLES.ADMIN]));

// route to create a new user
router.post("/", userController.createUser);

// route to get all users
router.get("/", userController.getAllUsers);

// route to change specific user roles
router.patch("/change-role/:userId", userController.changeUserRoles);

// route to change activation specific user
router.patch("/activation-status/:userId", userController.changeUserActivation);

// route to delete specific user

module.exports = router;
