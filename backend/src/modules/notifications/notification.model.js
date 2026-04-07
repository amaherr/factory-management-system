const mongoose = require("mongoose");
const { NOTIFICATION_STATUS } = require("../../enums/notification.enums");

const notificationSchema = new mongoose.Schema(
    {
        receiverUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        senderUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        status: {
            type: String,
            enum: Object.values(NOTIFICATION_STATUS),
            default: NOTIFICATION_STATUS.UNREAD,
            required: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Notification", notificationSchema);
