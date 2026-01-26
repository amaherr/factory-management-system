const mongoose = require("mongoose");

const { COLORS, PRODUCT_STATUS } = require("../enums/product.enums");

const productSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
        },

        color: {
            type: String,
            enum: Object.values(COLORS),
            required: true,
        },

        defaultImage: {
            type: String,
            trim: true,
        },

        // stock keeping unit
        sku: {
            type: Number,
            required: true,
            min: 0,
        },

        costPrice: {
            type: Number,
            min: 1,
        },

        salePrice: {
            type: Number,
            required: true,
            min: 1,
        },

        status: {
            type: String,
            required: true,
            enum: Object.values(PRODUCT_STATUS),
            default: PRODUCT_STATUS.PENDING,
        },

        deactivatedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        deactivatedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
