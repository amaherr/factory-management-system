const mongoose = require("mongoose");

const { RETURN_STATUS } = require("../../enums/return.enums");

const returnSchema = new mongoose.Schema(
    {
        returnNumber: {
            type: Number,
            required: true,
            unique: true,
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

        status: {
            type: String,
            required: true,
            enum: Object.values(RETURN_STATUS),
            default: RETURN_STATUS.DRAFT,
        },

        note: {
            type: String,
            trim: true,
            maxLength: 200,
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
                lineQuantity: {
                    // number of lines being returned
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
                    // snapshot from order
                    type: Number,
                    required: true,
                    min: 0,
                },
                totalPrice: {
                    // total refund for this line = actualQuantity * unitPrice
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

returnSchema.index({ orderId: 1, status: 1 });
returnSchema.index({ "items.productId": 1 });

const Return = mongoose.model("Return", returnSchema);
module.exports = Return;
