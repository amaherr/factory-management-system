const mongoose = require("mongoose");
const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");

const stockMovementSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        returnId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Return",
        },
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        quantityChange: {
            type: Number,
            required: true,
        },

        movementType: {
            type: String,
            enum: Object.values(STOCK_MOVEMENT_TYPE),
            required: true,
        },

        notes: {
            type: String,
            trim: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true, // createdAt & updatedAt (system audit)
    },
);

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
module.exports = StockMovement;
