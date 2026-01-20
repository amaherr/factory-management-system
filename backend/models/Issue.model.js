const mongoose = require("mongoose");

const issueSchema = mongoose.Schema({
    createdByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    issueType: {
        type: String,
        required: true,
        enum: ["inventory discrepancy", "damaged goods", "system bug"],
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["open", "in progress", "resolved", "cancelled"],
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
