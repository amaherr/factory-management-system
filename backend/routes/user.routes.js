const express = require("express");

const userService = require("../services/user.service");
const userDtos = require("../dtos/user.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// public login route
router.post("/login", validator({ bodySchema: userDtos.loginSchema }), userService.login);

// apply authorizor middleware (admin routes)
router.use(authorizor([ROLES.ADMIN]));

// route to create a new user
router.post("/", validator({ bodySchema: userDtos.createUserSchema }), userService.createUser);

// route to get all users
router.get("/", userService.getAllUsers);

// route to get a specific user
router.get("/:userId", userService.getUser);

// route to edit user details
router.patch(
    "/edit/:userId",
    validator({ bodySchema: userDtos.editUserSchema }),
    userService.editUser,
);

// route to change specific user roles
router.patch(
    "/change-role/:userId",
    validator({ bodySchema: userDtos.changeUserRolesSchema }),
    userService.changeUserRoles,
);

// route to change activation specific user
router.patch(
    "/activation-status/:userId",
    validator({ bodySchema: userDtos.changeUserActivationSchema }),
    userService.changeUserActivation,
);

// route to delete specific user
router.delete("/delete/:userId", userService.deleteUser);

module.exports = router;
