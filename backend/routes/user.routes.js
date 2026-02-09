const express = require("express");

const userController = require("../controllers/user.controller");
const userDtos = require("../dtos/user.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// public login route
router.post("/login", validator({ bodySchema: userDtos.loginSchema }), userController.login);

// apply authorizor middleware (admin routes)
router.use(authorizor([ROLES.ADMIN]));

// route to create a new user
router.post("/", validator({ bodySchema: userDtos.createUserSchema }), userController.createUser);

// route to get all users
router.get("/", userController.getAllUsers);

// route to get a specific user
router.get("/:userId", userController.getUser);

// route to edit user details
router.patch(
    "/edit/:userId",
    validator({ bodySchema: userDtos.editUserSchema }),
    userController.editUser,
);

// route to change specific user roles
router.patch(
    "/change-role/:userId",
    validator({ bodySchema: userDtos.changeUserRolesSchema }),
    userController.changeUserRoles,
);

// route to change activation specific user
router.patch(
    "/activation-status/:userId",
    validator({ bodySchema: userDtos.changeUserActivationSchema }),
    userController.changeUserActivation,
);

// route to delete specific user
router.delete("/delete/:userId", userController.deleteUser);

module.exports = router;
