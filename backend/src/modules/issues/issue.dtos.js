const Joi = require("joi");

const { ISSUE_TYPE, ISSUE_STATUS } = require("../../enums/issue.enums");
const { changeIssueStatus } = require("./issue.service");

const issueDtos = {
    createIssueSchema: Joi.object({
        issueType: Joi.string()
            .valid(...Object.values(ISSUE_TYPE))
            .required(),
        description: Joi.string().trim().min(1).max(200).required(),
    }),

    editUserIssueSchema: Joi.object({
        issueType: Joi.string()
            .valid(...Object.values(ISSUE_TYPE))
            .optional(),
        description: Joi.string().trim().min(1).max(200).optional(),
    }).min(1),

    changeIssueStatus: Joi.object({
        status: Joi.string().valid(ISSUE_STATUS.CANCELLED, ISSUE_STATUS.RESOLVED).required(),
    }),
};

module.exports = issueDtos;
