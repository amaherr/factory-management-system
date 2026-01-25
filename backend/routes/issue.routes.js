const express = require("express");

const issueController = require("../controllers/issue.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// route to create a new issue
router.post("/", issueController.createIssue);

// route to get all issues
router.get("/", authorizor([ROLES.ADMIN]), issueController.getAllIssues);

// route to get user issues
router.get("/my-issues", issueController.getUserIssues);

// route to get a specific issue
router.get("/:issueId", authorizor([ROLES.ADMIN]), issueController.getIssue);

module.exports = router;
