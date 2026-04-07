const mongoose = require("mongoose");

const { BATCH_EVENT_STAGES } = require("../enums/batchEvent.enums");

const batchEventSchema = mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true,
        },

        stage: {
            type: String,
            required: true,
            enum: Object.values(BATCH_EVENT_STAGES),
        },

        loss: {
            type: Number,
            required: true,
            min: 0,
        },

        notes: {
            type: String,
        },

        finalizedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
        },
    },
    { timestamps: true },
);

const BatchEvent = mongoose.model("BatchEvent", batchEventSchema);
module.exports = BatchEvent;
