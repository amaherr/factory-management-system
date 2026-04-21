const mongoose = require("mongoose");

const {
    STOCK_MOVEMENT_TYPE,
    WAREHOUSE_ACTIONS,
    EXECUTION_STATUS,
} = require("../../enums/stockMovement.enums");

const movementAllocationSchema = new mongoose.Schema(
    {
        location: {
            type: String,
            required: true,
            trim: true,
        },
        section: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false },
);

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
        executionStatus: {
            type: String,
            enum: Object.values(EXECUTION_STATUS),
            required: true,
            default: EXECUTION_STATUS.NOT_EXECUTED,
        },
        sourceAllocations: {
            type: [movementAllocationSchema],
            default: [],
        },
        destinationAllocations: {
            type: [movementAllocationSchema],
            default: [],
        },
        physicalQuantityExecuted: {
            type: Number,
            min: 0,
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
stockMovementSchema.index({ executionStatus: 1, createdAt: -1 });
stockMovementSchema.index({ warehouseAction: 1, executionStatus: 1, createdAt: -1 });
stockMovementSchema.index({ productId: 1, createdAt: -1 });

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
module.exports = StockMovement;
