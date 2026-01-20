import mongoose from "mongoose";

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
      enum: ["warehouse"], // to be done 
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Inventory", "Sales", "Sold out"],
      required: true,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Inventory", inventorySchema);
