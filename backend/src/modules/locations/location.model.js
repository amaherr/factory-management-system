const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 100,
        },
        code: {
            type: String,
            trim: true,
            minLength: 1,
            maxLength: 50,
        },
        notes: {
            type: String,
            trim: true,
            maxLength: 300,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

const locationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minLength: 1,
            maxLength: 100,
        },
        code: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
            minLength: 1,
            maxLength: 50,
        },
        notes: {
            type: String,
            trim: true,
            maxLength: 300,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        sections: {
            type: [sectionSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

locationSchema.index({ name: 1 }, { unique: true });
locationSchema.index({ code: 1 }, { unique: true, sparse: true });

const Location = mongoose.model("Location", locationSchema);
module.exports = Location;
