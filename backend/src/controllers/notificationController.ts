import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotificationModel } from '../models/Notification';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const notifications = await NotificationModel.findAllByUserId(userId);
    res.json(notifications);
  } catch (error) {
    console.error('Failed to get notifications', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const notificationId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const success = await NotificationModel.markAsRead(notificationId, userId);
    if (success) {
      res.json({ message: 'Marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Failed to mark notification as read', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await NotificationModel.markAllAsRead(userId);
    res.json({ message: 'All marked as read' });
  } catch (error) {
    console.error('Failed to mark all as read', error);
    res.status(500).json({ message: 'Server error' });
  }
};
