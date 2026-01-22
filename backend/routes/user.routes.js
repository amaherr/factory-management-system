const express = require("express");

const userController = require("../controllers/user.controller");

const router = express.Router();

// public login route
router.post("/login", userController.login);

module.exports = router;
