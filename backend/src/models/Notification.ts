import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Notification {
  id?: number;
  user_id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at?: string;
}

export class NotificationModel {
  static async findAllByUserId(userId: number): Promise<Notification[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return rows as Notification[];
  }

  static async create(notification: Notification): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [notification.user_id, notification.message, notification.type]
    );
    return result.insertId;
  }

  static async markAsRead(id: number, userId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  static async markAllAsRead(userId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return result.affectedRows > 0;
  }
}
