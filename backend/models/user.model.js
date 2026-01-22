const mongoose = require("mongoose");

const ROLES = require("../enums/roles.enum");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
            minlength: 6,
        },

        roles: {
            type: [
                {
                    type: String,
                    enum: Object.values(ROLES),
                },
            ],
            required: true,
        },

        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // createdAt & updatedAt
    },
);

const User = mongoose.model("User", userSchema);
module.exports = User;
