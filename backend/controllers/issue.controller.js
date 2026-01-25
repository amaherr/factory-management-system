const Issue = require("../models/issue.model");
const createError = require("../utils/errorFactory");

const issueController = {
    // function to create a new issue
    createIssue: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { issueType, description } = req.body;

            // create new issue
            const issue = await Issue.create({ createdByUserId: userId, issueType, description });

            res.status(201).json({
                success: true,
                message: "Issue created successfully",
                issue,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // function to get all issues
    getAllIssues: async (req, res, next) => {
        try {
            const issues = await Issue.find().populate("createdByUserId");

            res.status(200).json({
                success: true,
                message: "Issues retrieved successfully",
                issues,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // function to get a specific issue
    getIssue: async (req, res, next) => {
        try {
            const issueId = req.params.issueId;

            const issue = await Issue.findById(issueId).populate("createdByUserId");
            if (!issue) {
                return next("Issue not found", 404);
            }

            res.status(200).json({
                success: true,
                message: "Issue retrieved successfully",
                issue,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // function to get user issues
    getUserIssues: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // get issues
            const userIssues = await Issue.find({ createdByUserId: userId });

            res.status(200).json({
                success: true,
                message: "User issues retrieved successfully",
                userIssues,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },
};

module.exports = issueController;
