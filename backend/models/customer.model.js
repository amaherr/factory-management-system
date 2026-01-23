const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    // should be a enum of countries
    country: {
        type: String,
        required: true,
        trim: true,
    },

    // should be an enum of governates inside the country
    governate: {
        type: String,
        required: true,
        trim: true,
    },

    city: {
        type: String,
        required: true,
        trim: true,
    },

    street: {
        type: String,
        required: true,
        trim: true,
    },
});

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

        address: {
            type: addressSchema,
        },
    },
    {
        timestamps: true,
    },
);

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
