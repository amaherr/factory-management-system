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

// route to edit user issue
router.patch("/edit-my-issue/:issueId", issueController.editUserIssue);

// route to change the status of an issue
router.patch(
    "/change-status/:issueId",
    authorizor([ROLES.ADMIN]),
    issueController.changeIssueStatus,
);

// route to delete a speicif issue
router.delete("/delete/:issueId", authorizor([ROLES.ADMIN]), issueController.deleteIssue);

module.exports = router;
