import { Request, Response } from 'express';
import { z } from 'zod';
import { TaskModel } from '../models/Task';
import { NotificationModel } from '../models/Notification';
import { AuthRequest } from '../middlewares/authMiddleware';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Overdue']).default('Pending'),
  start_date: z.string(), // YYYY-MM-DD expected
  due_date: z.string(),
  assigned_employee_id: z.string().transform(v => v ? parseInt(v) : null).nullable().optional(),
}).refine(data => new Date(data.start_date) <= new Date(data.due_date), {
  message: "Due Date must not be earlier than Start Date",
  path: ["due_date"]
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Overdue']).optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  assigned_employee_id: z.union([z.string(), z.number()]).transform(v => v ? parseInt(v.toString()) : null).nullable().optional(),
}).refine(data => {
  if (data.start_date && data.due_date) {
    return new Date(data.start_date) <= new Date(data.due_date);
  }
  return true;
}, {
  message: "Due Date must not be earlier than Start Date",
  path: ["due_date"]
});

const getUserIdByEmployeeId = async (empId: number): Promise<number | null> => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT user_id FROM employees WHERE id = ?', [empId]);
  if (rows.length === 0) return null;
  return rows[0].user_id;
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!userRole || !userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (userRole === 'Admin') {
      const tasks = await TaskModel.findAll();
      res.json(tasks);
    } else {
      const empId = await TaskModel.getEmployeeIdByUserId(userId);
      if (!empId) {
        res.json([]);
        return;
      }
      const tasks = await TaskModel.findAll({ assigned_employee_id: empId });
      res.json(tasks);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if it's multipart form data, body values will be strings
    const validatedData = createTaskSchema.parse(req.body);

    const taskData = {
      ...validatedData,
      assigned_employee_id: validatedData.assigned_employee_id || null,
      file_path: req.file ? `/uploads/${req.file.filename}` : null,
    };

    const taskId = await TaskModel.create(taskData as any);

    // Create Notification if assigned
    if (taskData.assigned_employee_id) {
      const assignedUserId = await getUserIdByEmployeeId(taskData.assigned_employee_id);
      if (assignedUserId) {
        await NotificationModel.create({
          user_id: assignedUserId,
          message: `You have been assigned a new task: ${taskData.title}`,
          type: 'assignment',
          is_read: false
        });
      }
    }

    res.status(201).json({ message: 'Task created', id: taskId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = updateTaskSchema.parse(req.body);
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const task = await TaskModel.findById(id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Business Rule: Completed tasks cannot be edited
    if (task.status === 'Completed') {
      res.status(403).json({ message: 'Completed tasks cannot be edited' });
      return;
    }

    const updateData: any = { ...validatedData };
    if (req.file) {
      updateData.file_path = `/uploads/${req.file.filename}`;
    }

    if (userRole === 'Employee') {
      const empId = await TaskModel.getEmployeeIdByUserId(userId!);
      if (task.assigned_employee_id !== empId) {
        res.status(403).json({ message: 'Not authorized to edit this task' });
        return;
      }
      
      // Employees can only update status and file
      const allowedData: any = { status: updateData.status };
      if (updateData.file_path) {
        allowedData.file_path = updateData.file_path;
      }
      await TaskModel.update(id, allowedData);

      if (allowedData.status === 'Completed' && task.status !== 'Completed') {
        // Fetch user name since it's not in the JWT token
        const [users] = await pool.query<RowDataPacket[]>('SELECT name FROM users WHERE id = ?', [req.user?.id]);
        const employeeName = users[0]?.name || 'Employee';

        // Notify admin that task is completed
        // For simplicity, we just find all admins and notify them
        const [admins] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE role = "Admin"');
        for (const admin of admins) {
          await NotificationModel.create({
            user_id: admin.id,
            message: `Task completed: ${task.title} by ${employeeName}`,
            type: 'completion',
            is_read: false
          });
        }
      }

      res.json({ message: 'Task status updated' });
    } else {
      // Admin can update anything
      await TaskModel.update(id, updateData);

      // Check if assignee changed
      if (updateData.assigned_employee_id && updateData.assigned_employee_id !== task.assigned_employee_id) {
        const assignedUserId = await getUserIdByEmployeeId(updateData.assigned_employee_id);
        if (assignedUserId) {
          await NotificationModel.create({
            user_id: assignedUserId,
            message: `You have been assigned a task: ${updateData.title || task.title}`,
            type: 'assignment',
            is_read: false
          });
        }
      }

      res.json({ message: 'Task updated' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const success = await TaskModel.delete(id);
    if (success) {
      res.json({ message: 'Task deleted' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
