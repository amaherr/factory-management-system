const Notification = require("../models/notification.model");
const createError = require("../utils/errorFactory");

const notificationController = {
    // function to get the current user's notifications
    getUserNotifications: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // get all notifications with receiver = user id
            const notifications = await Notification.find({ receiverUserId: userId });

            res.status(200).json({
                success: true,
                message: "Notifications retrieved successfully",
                notifications,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // function to get the user's sended notifications
    getUserSendedNotifications: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // get all notifications with sender = user id
            const notifications = await Notification.find({ senderUserId: userId });

            res.status(200).json({
                success: true,
                message: "Notifications retrieved successfully",
                notifications,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },
};

module.exports = notificationController;
