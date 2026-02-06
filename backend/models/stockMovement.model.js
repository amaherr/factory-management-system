const mongoose = require("mongoose");
const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");

const stockMovementSchema = new mongoose.Schema(
    {
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

        movementTime: {
            type: Date,
            default: Date.now, // business time when stock actually changed
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
