const Batch = require("./batch.model");
const { BATCH_STATUS } = require("../../enums/batch.enums");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function createBatch(data, tx = null) {
    const session = getMongoSession(tx);
    const [batch] = await Batch.create([data], { session });
    return batch;
}

async function getAllBatches(data = null, tx = null) {
    const session = getMongoSession(tx);
    const query = Batch.find()
        .populate("productId", "name code")
        .populate("orderId", "orderNumber");
    if (session) {
        query.session(session);
    }
    return query;
}

async function getBatchById(batchId, tx = null) {
    const session = getMongoSession(tx);
    const query = Batch.findById(batchId)
        .populate("productId", "name code")
        .populate("orderId", "orderNumber");
    if (session) {
        query.session(session);
    }
    return query;
}

async function getBatchByIdRaw(batchId, tx = null) {
    const session = getMongoSession(tx);
    const query = Batch.findById(batchId);
    if (session) {
        query.session(session);
    }
    return query;
}

async function updatePlanningBatchById(data, tx = null) {
    const { batchId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = { new: true, runValidators: true };
    if (session) {
        options.session = session;
    }

    return Batch.findOneAndUpdate(
        { _id: batchId, status: BATCH_STATUS.PLANNING },
        updateObject,
        options,
    );
}

async function updateBatchById(data, tx = null) {
    const { batchId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = { new: true, runValidators: true };
    if (session) {
        options.session = session;
    }

    return Batch.findByIdAndUpdate(batchId, updateObject, options);
}

async function deleteBatchById(batchId, tx = null) {
    const session = getMongoSession(tx);
    if (session) {
        return Batch.deleteOne({ _id: batchId }, { session });
    }
    return Batch.deleteOne({ _id: batchId });
}

const batchRepository = {
    createBatch,
    getAllBatches,
    getBatchById,
    getBatchByIdRaw,
    updatePlanningBatchById,
    updateBatchById,
    deleteBatchById,
};

module.exports = batchRepository;
