const mongoose = require("mongoose");

const { ISSUE_TYPE, ISSUE_STATUS } = require("../enums/issue.enums");

const issueSchema = mongoose.Schema({
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
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(ISSUE_STATUS),
        default: "open",
    },
    resolvedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    resolvedAt: {
        type: Date,
    },
});

const Issue = mongoose.model("Issue", issueSchema);
module.exports = Issue;
