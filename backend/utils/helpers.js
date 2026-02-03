const Counter = require("../models/counter.model");

async function getNextDocumentNumber(name, session) {
    const doc = await Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session },
    );
    return doc.seq;
}

function isPositiveNumber(n) {
    return typeof n === "number" && Number.isFinite(n) && n >= 0;
}
module.exports = { getNextDocumentNumber, isPositiveNumber };
