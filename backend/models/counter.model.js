const mongoose = require("mongoose");

const { COUNTERS } = require("../enums/counter.enums");

const counterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: Object.values(COUNTERS),
    },
    seq: {
        type: Number,
        default: 0,
    },
});

const Counter = mongoose.model("Counter", counterSchema);
module.exports = Counter;
