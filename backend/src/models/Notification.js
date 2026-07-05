"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const db_1 = __importDefault(require("../config/db"));
const mysql2_1 = require("mysql2");
class NotificationModel {
    static async findAllByUserId(userId) {
        const [rows] = await db_1.default.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);
        return rows;
    }
    static async create(notification) {
        const [result] = await db_1.default.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)', [notification.user_id, notification.message, notification.type]);
        return result.insertId;
    }
    static async markAsRead(id, userId) {
        const [result] = await db_1.default.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }
    static async markAllAsRead(userId) {
        const [result] = await db_1.default.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId]);
        return result.affectedRows > 0;
    }
}
exports.NotificationModel = NotificationModel;
//# sourceMappingURL=Notification.js.map