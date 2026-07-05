"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const notifications = await Notification_1.NotificationModel.findAllByUserId(userId);
        res.json(notifications);
    }
    catch (error) {
        console.error('Failed to get notifications', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        const notificationId = parseInt(req.params.id);
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const success = await Notification_1.NotificationModel.markAsRead(notificationId, userId);
        if (success) {
            res.json({ message: 'Marked as read' });
        }
        else {
            res.status(404).json({ message: 'Notification not found' });
        }
    }
    catch (error) {
        console.error('Failed to mark notification as read', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        await Notification_1.NotificationModel.markAllAsRead(userId);
        res.json({ message: 'All marked as read' });
    }
    catch (error) {
        console.error('Failed to mark all as read', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markAllAsRead = markAllAsRead;
//# sourceMappingURL=notificationController.js.map