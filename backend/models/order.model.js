const mongoose = require("mongoose");

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
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        orderDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        status: {
            type: String,
            required: true,
            enum: ["pending", "cancelled", "shipped"],
            default: "pending",
        },
        notes: {
            type: String,
        },
    },
    { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
