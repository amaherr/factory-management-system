const Issue = require("./issue.model");

const { COUNTERS } = require("../../enums/counter.enums");
const { ISSUE_STATUS } = require("../../enums/issue.enums");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");
const { getNextDocumentNumber } = require("../../utils/helpers");

async function createIssueWithNextNumber(data, tx = null) {
    const { createdByUserId, issueType, description } = data;
    const session = getMongoSession(tx);
    const issueNumber = await getNextDocumentNumber(COUNTERS.ISSUE_NUMBER, session);

    const [issue] = await Issue.create(
        [
            {
                issueNumber,
                createdByUserId,
                issueType,
                description,
            },
        ],
        { session },
    );

    return issue;
}

async function getAllIssues(data = null, tx = null) {
    const session = getMongoSession(tx);
    const query = Issue.find().populate(
        "createdByUserId resolvedByUserId cancelledByUserId",
        "name phoneNumber",
    );
    if (session) {
        query.session(session);
    }
    return query;
}

async function getIssueById(issueId, tx = null) {
    const session = getMongoSession(tx);
    const query = Issue.findById(issueId).populate(
        "createdByUserId resolvedByUserId cancelledByUserId",
    );
    if (session) {
        query.session(session);
    }
    return query;
}

async function getIssuesByCreatorUserId(createdByUserId, tx = null) {
    const session = getMongoSession(tx);
    const query = Issue.find({ createdByUserId }).populate(
        "createdByUserId resolvedByUserId cancelledByUserId",
        "name phoneNumber",
    );
    if (session) {
        query.session(session);
    }
    return query;
}

async function updateUserOpenIssue(data, tx = null) {
    const { issueId, userId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = { new: true, runValidators: true };
    if (session) {
        options.session = session;
    }

    return Issue.findOneAndUpdate(
        { _id: issueId, createdByUserId: userId, status: ISSUE_STATUS.OPEN },
        { $set: updateObject },
        options,
    );
}

async function updateIssueById(data, tx = null) {
    const { issueId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = { new: true, runValidators: true };
    if (session) {
        options.session = session;
    }
    return Issue.findByIdAndUpdate(issueId, updateObject, options);
}

async function deleteIssueById(issueId, tx = null) {
    const session = getMongoSession(tx);
    const options = {};
    if (session) {
        options.session = session;
    }
    return Issue.findByIdAndDelete(issueId, options);
}

const issueRepository = {
    createIssueWithNextNumber,
    getAllIssues,
    getIssueById,
    getIssuesByCreatorUserId,
    updateUserOpenIssue,
    updateIssueById,
    deleteIssueById,
};

module.exports = issueRepository;
