const express = require("express");

const issueService = require("../services/issue.service");
const issueDtos = require("../dtos/issue.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// route to create a new issue
router.post("/", validator({ bodySchema: issueDtos.createIssueSchema }), issueService.createIssue);

// route to get all issues
router.get("/", authorizor([ROLES.ADMIN]), issueService.getAllIssues);

// route to get user issues
router.get("/my-issues", issueService.getUserIssues);

// route to get a specific issue
router.get("/:issueId", authorizor([ROLES.ADMIN]), issueService.getIssue);

// route to edit user issue
router.patch(
    "/edit-my-issue/:issueId",
    validator({ bodySchema: issueDtos.editUserIssueSchema }),
    issueService.editUserIssue,
);

// route to change the status of an issue
router.patch(
    "/change-status/:issueId",
    validator({ bodySchema: issueDtos.changeIssueStatus }),
    authorizor([ROLES.ADMIN]),
    issueService.changeIssueStatus,
);

// route to delete a speicif issue
router.delete("/delete/:issueId", authorizor([ROLES.ADMIN]), issueService.deleteIssue);

module.exports = router;
