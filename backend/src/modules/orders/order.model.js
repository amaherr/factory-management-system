const mongoose = require("mongoose");
const { ORDER_TYPE, ORDER_STATUS } = require("../../enums/order.enums");

const itemSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    lineQuantity: {
        // number of lines ordered by user
        type: Number,
        required: true,
        min: 1,
    },
    actualQuantity: {
        // lineQuantity times product sku (total individual units)
        type: Number,
        required: true,
        min: 1,
    },
    unitPrice: {
        // price per unit (snapshot at order time)
        type: Number,
        required: true,
        min: 0,
    },
    totalPrice: {
        // total price for this line item = actualQuantity * unitPrice
        type: Number,
        required: true,
        min: 0,
    },
    itemType: {
        // individual item fulfillment type: on shelf or on demand
        type: String,
        enum: Object.values(ORDER_TYPE),
        required: true,
    },
});

const orderSchema = mongoose.Schema(
    {
        orderNumber: {
            type: Number,
            required: true,
            unique: true,
        },

        createdByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },

        // order items and price data
        items: [itemSchema],
        subTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        discountAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        taxAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },

        notes: {
            type: String,
        },

        // status-related data
        status: {
            type: String,
            required: true,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.DRAFT,
        },
        finalizedAt: {
            type: Date,
        },
        finalizedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        cancelledAt: {
            type: Date,
        },
        cancelledByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true },
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ createdByUserId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
