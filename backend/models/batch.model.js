const mongoose = require("mongoose");

const { BATCH_STATUS } = require("../enums/batch.enums");

const batchSchema = mongoose.Schema(
    {
        batchNumber: {
            type: Number,
            required: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        status: {
            type: String,
            enum: Object.values(BATCH_STATUS),
            default: BATCH_STATUS.PLANNING,
        },
        plannedQuantity: {
            type: Number,
            required: true,
            min: 0,
        },
        producedQuantity: {
            type: Number,
            min: 0,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now(),
        },
        endDate: {
            type: Date,
        },
    },
    { timestamps: true },
);

const Batch = mongoose.model("Batch", batchSchema);
module.exports = Batch;
