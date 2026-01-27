const express = require("express");

const notificationController = require("../controllers/notification.controller");

const router = express.Router();

// route to get user's notifications
router.get("/my-notifications", notificationController.getUserNotifications);

// route to get user's sended notifcations
router.get("/my-sended-notifications", notificationController.getUserSendedNotifications);

// route to change my notification status
router.patch("/change-status/:notificationId", notificationController.changeNotificationStatus);

module.exports = router;
