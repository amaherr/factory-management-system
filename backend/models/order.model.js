const mongoose = require("mongoose");
const { ORDER_TYPE, ORDER_STATUS } = require("../enums/order.enums");

const orderSchema = mongoose.Schema(
    {
        orderNumber: {
            type: Number,
            required: true,
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
        orderType: {
            type: String,
            enum: Object.values(ORDER_TYPE),
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                unitPrice: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],
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
        status: {
            type: String,
            required: true,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.DRAFT,
        },
        notes: {
            type: String,
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

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
