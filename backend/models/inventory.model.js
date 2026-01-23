const mongoose = require("mongoose");

const { FACTORY_LOCATIONS } = require("../enums/inventory.enums");

const inventorySchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        quantityInStock: {
            type: Number,
            required: true,
            min: 0,
        },

        quantitySold: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        locationInFactory: {
            type: String,
            required: true,
            enum: Object.values(FACTORY_LOCATIONS),
        },
    },
    {
        timestamps: true,
    },
);

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
