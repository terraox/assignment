import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { TaskModel } from '../models/Task';

export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [empCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM employees');
    const [taskStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
    `);

    res.json({
      totalEmployees: empCount[0].total,
      totalTasks: taskStats[0].total_tasks || 0,
      completedTasks: taskStats[0].completed_tasks || 0,
      pendingTasks: taskStats[0].pending_tasks || 0,
      inProgressTasks: taskStats[0].in_progress_tasks || 0,
      overdueTasks: taskStats[0].overdue_tasks || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEmployeeDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const empId = await TaskModel.getEmployeeIdByUserId(userId);
    if (!empId) {
      res.json({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
      });
      return;
    }

    const [taskStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
      WHERE assigned_employee_id = ?
    `, [empId]);

    res.json({
      totalTasks: taskStats[0].total_tasks || 0,
      completedTasks: taskStats[0].completed_tasks || 0,
      pendingTasks: taskStats[0].pending_tasks || 0,
      inProgressTasks: taskStats[0].in_progress_tasks || 0,
      overdueTasks: taskStats[0].overdue_tasks || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
