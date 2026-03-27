const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    // should be a enum of countries
    country: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 35,
    },

    // should be an enum of governates inside the country
    governate: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 35,
    },

    city: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 35,
    },

    street: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
    },
});

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 35,
        },

        company: {
            type: String,
            trim: true,
            minLength: 1,
        },

        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minLength: 1,
            maxLength: 20,
        },

        address: {
            type: addressSchema,
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

customerSchema.index({ createdAt: -1 });

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
