const mongoose = require("mongoose");

const Issue = require("../models/issue.model");

const { COUNTERS } = require("../enums/counter.enums");
const { ISSUE_STATUS } = require("../enums/issue.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");
const { getNextDocumentNumber } = require("../utils/helpers");

const issueService = {
    // function to create a new issue
    createIssue: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const { issueType, description } = req.body;

            const issue = await session.withTransaction(async () => {
                // get issue number
                const issueNumber = await getNextDocumentNumber(COUNTERS.ISSUE_NUMBER, session);

                // create new issue
                const issue = await Issue.create({
                    issueNumber,
                    createdByUserId: userId,
                    issueType,
                    description,
                });
                return issue;
            });

            res.status(201).json(response("Issue created successfully", issue));
        } catch (err) {
            return next(err);
        }
    },

    // function to get all issues
    getAllIssues: async (req, res, next) => {
        try {
            const issues = await Issue.find().populate(
                "createdByUserId resolvedByUserId cancelledByUserId",
                "name phoneNumber",
            );

            res.status(200).json(response("Issues retrieved successfully", issues));
        } catch (err) {
            return next(err);
        }
    },

    // function to get a specific issue
    getIssue: async (req, res, next) => {
        try {
            const issueId = req.params.issueId;

            const issue = await Issue.findById(issueId).populate(
                "createdByUserId resolvedByUserId cancelledByUserId",
            );
            if (!issue) {
                return next(createError("Issue not found", 404));
            }

            res.status(200).json(response("Issue retrieved successfully", issue));
        } catch (err) {
            return next(err);
        }
    },

    // function to get user issues
    getUserIssues: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // get issues
            const userIssues = await Issue.find({ createdByUserId: userId }).populate(
                "createdByUserId resolvedByUserId cancelledByUserId",
                "name phoneNumber",
            );

            res.status(200).json(response("User issues retrieved successfully", userIssues));
        } catch (err) {
            return next(err);
        }
    },

    // function to edit a user's issue
    editUserIssue: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const issueId = req.params.issueId;
            const { issueType, description } = req.body;

            // construct update fields
            const updateObject = {};
            if (issueType !== undefined) updateObject.issueType = issueType;
            if (description !== undefined) updateObject.description = description;

            // update open issue made by authenticated user
            const updatedIssue = await Issue.findOneAndUpdate(
                { _id: issueId, createdByUserId: userId, status: ISSUE_STATUS.OPEN },
                { $set: updateObject },
                { new: true, runValidators: true },
            );
            if (!updatedIssue) {
                return next(createError("Issue not found or cannot be editted", 403));
            }

            res.status(200).json(response("Issue updated successfully", updatedIssue));
        } catch (err) {
            return next(err);
        }
    },

    // function to change the status of an issue
    changeIssueStatus: async (req, res, next) => {
        try {
            const issueId = req.params.issueId;
            const userId = req.user.id;
            const { status } = req.body;

            // populate update fields
            const updateObject = {};
            updateObject.status = status;
            if (status === ISSUE_STATUS.CANCELLED) {
                updateObject.cancelledByUserId = userId;
                updateObject.cancelledAt = Date.now();

                updateObject.resolvedByUserId = null;
                updateObject.resolvedAt = null;
            } else if (status === ISSUE_STATUS.RESOLVED) {
                updateObject.cancelledByUserId = null;
                updateObject.cancelledAt = null;

                updateObject.resolvedByUserId = userId;
                updateObject.resolvedAt = Date.now();
            }

            // change status
            const updatedIssue = await Issue.findByIdAndUpdate(issueId, updateObject, {
                new: true,
                runValidators: true,
            });
            if (!updatedIssue) {
                return next(createError("Issue not found", 404));
            }

            res.status(200).json(response("Issue status updated successfully", updatedIssue));
        } catch (err) {
            return next(err);
        }
    },

    // function to delete a specific issue
    deleteIssue: async (req, res, next) => {
        try {
            const issueId = req.params.issueId;

            // delete issue
            const deletedIssue = await Issue.findByIdAndDelete(issueId);
            if (!deletedIssue) {
                return next(createError("Issue not found", 404));
            }

            res.status(200).json(response("Issue deleted successfully", deletedIssue));
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = issueService;
