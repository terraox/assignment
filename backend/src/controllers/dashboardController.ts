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

    const [employeeStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        e.id, 
        u.name, 
        u.email,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN t.status = 'Overdue' THEN 1 ELSE 0 END) as overdue
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN tasks t ON t.assigned_employee_id = e.id
      GROUP BY e.id, u.name, u.email
    `);

    const [recentTasks] = await pool.query<RowDataPacket[]>(`
      SELECT 
        t.id, t.title, t.status, t.due_date, t.completed_at, 
        u.name as assigned_to
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);

    res.json({
      totalEmployees: empCount[0].total,
      totalTasks: taskStats[0].total_tasks || 0,
      completedTasks: taskStats[0].completed_tasks || 0,
      pendingTasks: taskStats[0].pending_tasks || 0,
      inProgressTasks: taskStats[0].in_progress_tasks || 0,
      overdueTasks: taskStats[0].overdue_tasks || 0,
      employeeStats: employeeStats,
      recentTasks: recentTasks,
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
        tasks: [],
        employee: null
      });
      return;
    }

    const [employeeInfo] = await pool.query<RowDataPacket[]>(`
      SELECT u.name, u.email, e.department, e.designation
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [empId]);

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

    const [tasks] = await pool.query<RowDataPacket[]>(`
      SELECT id, title, priority, status, start_date, due_date, completed_at
      FROM tasks
      WHERE assigned_employee_id = ?
      ORDER BY created_at DESC
    `, [empId]);

    res.json({
      employee: employeeInfo[0],
      totalTasks: taskStats[0].total_tasks || 0,
      completedTasks: taskStats[0].completed_tasks || 0,
      pendingTasks: taskStats[0].pending_tasks || 0,
      inProgressTasks: taskStats[0].in_progress_tasks || 0,
      overdueTasks: taskStats[0].overdue_tasks || 0,
      tasks: tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEmployeeHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const empId = req.params.id;

    const [employeeInfo] = await pool.query<RowDataPacket[]>(`
      SELECT u.name, u.email, e.department, e.designation
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [empId]);

    if (!employeeInfo.length) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const [tasks] = await pool.query<RowDataPacket[]>(`
      SELECT id, title, priority, status, start_date, due_date, completed_at
      FROM tasks
      WHERE assigned_employee_id = ?
      ORDER BY created_at DESC
    `, [empId]);

    res.json({
      employee: employeeInfo[0],
      tasks: tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getEmployeeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [employeeStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        e.id, 
        u.name, 
        u.email,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN t.status = 'Overdue' THEN 1 ELSE 0 END) as overdue
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN tasks t ON t.assigned_employee_id = e.id
      GROUP BY e.id, u.name, u.email
    `);

    res.json({ employeeStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
