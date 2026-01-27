const mongoose = require("mongoose");

const { FACTORY_LOCATIONS } = require("../enums/inventory.enums");

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true, // one inventory doc per product
    },

    // Global (product-level) totals
    totalInStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    quantitySold: {
      type: Number,
      required: true,
      min: 0,
      default: 0, // global sold for the product
    },

    // Location-level stock
    locations: [
      {
        location: {
          type: String,
          enum: Object.values(FACTORY_LOCATIONS),
          required: true,
        },
        quantityInStock: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    ],

   
  },

    {
        timestamps: true,
    },
);

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
