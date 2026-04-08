const BatchEvent = require("./batchEvent.model");
const { BATCH_EVENT_STAGES } = require("../../enums/batchEvent.enums");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function createBatchEvent(data, tx = null) {
    const session = getMongoSession(tx);
    const [event] = await BatchEvent.create([data], { session });
    return event;
}

async function getEventsByBatchId(batchId, tx = null) {
    const session = getMongoSession(tx);
    const query = BatchEvent.find({ batchId });
    if (session) {
        query.session(session);
    }
    return query;
}

async function getEventByBatchIdAndStage(data, tx = null) {
    const { batchId, stage } = data;
    const session = getMongoSession(tx);
    const query = BatchEvent.findOne({ batchId, stage });
    if (session) {
        query.session(session);
    }
    return query;
}

async function updatePlanningEventStartDate(data, tx = null) {
    const { batchId, startDate } = data;
    const session = getMongoSession(tx);
    const options = { new: true };
    if (session) {
        options.session = session;
    }

    return BatchEvent.findOneAndUpdate(
        { batchId, stage: BATCH_EVENT_STAGES.PLANNING },
        { startDate },
        options,
    );
}

async function saveBatchEvent(data, tx = null) {
    const { eventDoc } = data;
    const session = getMongoSession(tx);
    if (session) {
        return eventDoc.save({ session });
    }
    return eventDoc.save();
}

async function deleteEventsByBatchId(batchId, tx = null) {
    const session = getMongoSession(tx);
    if (session) {
        return BatchEvent.deleteMany({ batchId }, { session });
    }
    return BatchEvent.deleteMany({ batchId });
}

const batchEventRepository = {
    createBatchEvent,
    getEventsByBatchId,
    getEventByBatchIdAndStage,
    updatePlanningEventStartDate,
    saveBatchEvent,
    deleteEventsByBatchId,
};

module.exports = batchEventRepository;
