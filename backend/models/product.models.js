import mongoose from "mongoose";

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
      enum: [
        "Red",
        "Blue",
        "Black",
        "White",
        "Green",
        "Yellow",
        "Gray",
        "Navy",
        "Brown",
        "Beige",
        "Pink",
        "Purple",
        "Orange",
      ],
      required: true,
    },

    defaultImage: {
      type: String,
      trim: true,
    },

    quantityPerSize: {
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
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Product", productSchema);
