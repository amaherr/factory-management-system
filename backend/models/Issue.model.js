const mongoose = require("mongoose");

const { ISSUE_TYPE, ISSUE_STATUS } = require("../enums/issue.enums");

const issueSchema = mongoose.Schema({
    issueNumber: {
        type: Number,
        required: true,
        unique: true,
    },
    createdByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    issueType: {
        type: String,
        required: true,
        enum: Object.values(ISSUE_TYPE),
    },
    description: {
        type: String,
        required: true,
        maxLength: 200,
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(ISSUE_STATUS),
        default: ISSUE_STATUS.OPEN,
    },
    resolvedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    resolvedAt: {
        type: Date,
    },
    cancelledByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    cancelledAt: {
        type: Date,
    },
});

const Issue = mongoose.model("Issue", issueSchema);
module.exports = Issue;
