const mongoose = require("mongoose");

const Return = require("./return.model");
const { RETURN_STATUS } = require("../../enums/return.enums");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function createReturn(data, tx = null) {
    const session = getMongoSession(tx);
    const [newReturn] = await Return.create([data], { session });
    return newReturn;
}

async function getReturnById(returnId, tx = null) {
    const session = getMongoSession(tx);
    const query = Return.findById(returnId);
    if (session) {
        query.session(session);
    }
    return query;
}

async function updateReturnById(data, tx = null) {
    const { returnId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = {
        new: true,
        runValidators: true,
    };
    if (session) {
        options.session = session;
    }

    return Return.findByIdAndUpdate(returnId, updateObject, options);
}

async function getAllReturns(data = null, tx = null) {
    const session = getMongoSession(tx);
    const query = Return.find().populate("orderId").populate("userId").populate("items.productId");
    if (session) {
        query.session(session);
    }
    return query;
}

async function getReturnsByProductId(productId, tx = null) {
    const session = getMongoSession(tx);
    const query = Return.find({ "items.productId": productId })
        .populate("orderId")
        .populate("userId")
        .populate("items.productId");
    if (session) {
        query.session(session);
    }
    return query;
}

async function getReturnsByOrderId(orderId, tx = null) {
    const session = getMongoSession(tx);
    const query = Return.find({ orderId })
        .populate("orderId")
        .populate("userId")
        .populate("items.productId");
    if (session) {
        query.session(session);
    }
    return query;
}

async function getReturnsByOrderIds(orderIds, tx = null) {
    const session = getMongoSession(tx);
    const query = Return.find({ orderId: { $in: orderIds } })
        .populate("orderId")
        .populate("userId")
        .populate("items.productId");
    if (session) {
        query.session(session);
    }
    return query;
}

async function getFinalizedReturnedByOrderExcludingReturn(data, tx = null) {
    const { orderId, returnId } = data;
    const session = getMongoSession(tx);
    const query = Return.aggregate([
        {
            $match: {
                orderId: new mongoose.Types.ObjectId(orderId),
                status: RETURN_STATUS.FINALIZED,
                _id: { $ne: new mongoose.Types.ObjectId(returnId) },
            },
        },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                returnedQty: { $sum: "$items.lineQuantity" },
            },
        },
    ]);

    if (session) {
        query.session(session);
    }

    return query;
}

async function getReturnedByOrderExcludingReturn(data, tx = null) {
    const { orderId, returnId, statuses = [RETURN_STATUS.DRAFT, RETURN_STATUS.FINALIZED] } = data;
    const session = getMongoSession(tx);

    const match = {
        orderId: new mongoose.Types.ObjectId(orderId),
        status: { $in: statuses },
    };

    if (returnId) {
        match._id = { $ne: new mongoose.Types.ObjectId(returnId) };
    }

    const query = Return.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                returnedQty: { $sum: "$items.lineQuantity" },
            },
        },
    ]);

    if (session) {
        query.session(session);
    }

    return query;
}

async function deleteReturnById(returnId, tx = null) {
    const session = getMongoSession(tx);
    if (session) {
        return Return.deleteOne({ _id: returnId }, { session });
    }
    return Return.deleteOne({ _id: returnId });
}

const returnRepository = {
    createReturn,
    getReturnById,
    updateReturnById,
    getAllReturns,
    getReturnsByProductId,
    getReturnsByOrderId,
    getReturnsByOrderIds,
    getFinalizedReturnedByOrderExcludingReturn,
    getReturnedByOrderExcludingReturn,
    deleteReturnById,
};

module.exports = returnRepository;
