const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
    {
        returnNumber: {
            type: Number,
            required: true,
        },

        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        note: {
            type: String,
            trim: true,
        },

        returnDate: {
            type: Date,
            default: Date.now, // business date (when return happened)
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
    },
    {
        timestamps: true, // createdAt & updatedAt
    },
);

const Return = mongoose.model("Return", returnSchema);
module.exports = Return;
