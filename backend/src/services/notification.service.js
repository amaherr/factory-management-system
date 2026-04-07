const Notification = require("../models/notification.model");
const { NOTIFICATION_STATUS } = require("../enums/notification.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");

const notificationService = {
    // function to get the current user's notifications
    getUserNotifications: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // get all notifications with receiver = user id
            const notifications = await Notification.find({ receiverUserId: userId });

            res.status(200).json(response("Notifications retrieved successfully", notifications));
        } catch (err) {
            return next(err);
        }
    },

    // function to get the user's sended notifications
    getUserSendedNotifications: async (req, res, next) => {
        try {
            const userId = req.user.id;

            // get all notifications with sender = user id
            const notifications = await Notification.find({ senderUserId: userId });

            res.status(200).json(response("Notifications retrieved successfully", notifications));
        } catch (err) {
            return next(err);
        }
    },

    // function to change the status of a notification for the current user
    changeNotificationStatus: async (req, res, next) => {
        try {
            const notificationId = req.params.notificationId;
            const userId = req.user.id;

            // update notification
            const updatedNotification = await Notification.findByIdAndUpdate(
                { _id: notificationId, receiverUserId: userId },
                { status: NOTIFICATION_STATUS.READ },
                { new: true, runValidators: true },
            );
            if (!updatedNotification) {
                return next(createError("Notification not found", 404));
            }

            res.status(200).json(
                response("Notification status updated successfully", updatedNotification),
            );
        } catch (err) {
            return next(err);
        }
    },
};
module.exports = notificationService;
