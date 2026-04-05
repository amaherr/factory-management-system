const express = require("express");

const notificationService = require("../services/notification.service");

const router = express.Router();

// route to get user's notifications
router.get("/my-notifications", notificationService.getUserNotifications);

// route to get user's sended notifcations
router.get("/my-sended-notifications", notificationService.getUserSendedNotifications);

// route to change my notification status
router.patch("/change-status/:notificationId", notificationService.changeNotificationStatus);

module.exports = router;
