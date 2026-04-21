const mongoose = require("mongoose");

const { COLORS, PRODUCT_STATUS, SEASONS } = require("../../enums/product.enums");

const productSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minLength: 1,
            maxLength: 50,
        },

        // product info
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 200,
        },
        description: {
            type: String,
            trim: true,
            minLength: 1,
            maxLength: 2000,
        },
        color: {
            type: String,
            enum: Object.values(COLORS),
            required: true,
        },
        season: {
            type: String,
            enum: Object.values(SEASONS),
        },
        defaultImage: {
            type: String,
            trim: true,
        },

        // stock keeping unit
        sku: {
            type: Number,
            required: true,
            min: 1,
        },

        // price-related data
        unitCostPrice: {
            type: Number,
            min: 1,
        },
        unitSalePrice: {
            type: Number,
            required: true,
            min: 1,
        },
        lineCostPrice: {
            type: Number,
            required: true,
            min: 1,
        },
        lineSalePrice: {
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

        // Global (product-level) totals
        totalTheoreticalStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalPhysicalStock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalReserved: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        totalSold: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        // Location-level stock
        locations: [
            {
                location: {
                    type: String,
                    trim: true,
                    required: true,
                },
                section: {
                    type: String,
                    trim: true,
                    default: "UNSPECIFIED",
                },
                quantityInStock: {
                    type: Number,
                    required: true,
                    min: 0,
                    default: 0,
                },
            },
        ],

        deactivatedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        deactivatedAt: {
            type: Date,
        },

        activatedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        activatedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ totalPhysicalStock: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ "locations.location": 1, "locations.quantityInStock": 1 });
productSchema.index({
    "locations.location": 1,
    "locations.section": 1,
    "locations.quantityInStock": 1,
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
