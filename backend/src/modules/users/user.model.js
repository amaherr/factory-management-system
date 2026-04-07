const mongoose = require("mongoose");

const { ROLES } = require("../../enums/user.enums");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minLength: 1,
            maxLength: 35,
        },

        password: {
            type: String,
            required: true,
            select: false,
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
            minLength: 1,
            maxLength: 20,
        },

        lastLoginAt: {
            type: Date,
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
