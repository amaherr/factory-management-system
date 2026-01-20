import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        company: {
            type: String,
            trim: true,
        },

        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        ordersCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    },
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
