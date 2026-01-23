import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
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
  }
);

export default mongoose.model("Return", returnSchema);
