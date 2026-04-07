const mongoose = require("mongoose");

const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../enums/stockMovement.enums");
const { FACTORY_LOCATIONS } = require("../enums/product.enums");

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

        from: {
            type: String,
            enum: Object.values(STOCK_MOVEMENT_TYPE),
            required: true,
        },
        to: {
            type: String,
            enum: Object.values(STOCK_MOVEMENT_TYPE),
            required: true,
        },

        notes: {
            type: String,
            trim: true,
        },

        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // physical stock information
        warehouseAction: {
            type: String,
            enum: Object.values(WAREHOUSE_ACTIONS),
            default: null,
        },
        isExecuted: {
            type: Boolean,
            required: true,
            default: false,
        },
        sourceLocation: {
            type: String,
            enum: Object.values(FACTORY_LOCATIONS),
            default: null,
        },
        destinationLocation: {
            type: String,
            enum: Object.values(FACTORY_LOCATIONS),
            default: null,
        },

        physicalExecutedAt: {
            type: Date,
            default: null,
        },
        physicalExecutedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true, // createdAt & updatedAt (system audit)
    },
);

stockMovementSchema.index({ orderId: 1, createdAt: -1 });

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
module.exports = StockMovement;
