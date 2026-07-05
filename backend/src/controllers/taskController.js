"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const Task_1 = require("../models/Task");
const Notification_1 = require("../models/Notification");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const db_1 = __importDefault(require("../config/db"));
const mysql2_1 = require("mysql2");
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']).default('Medium'),
    status: zod_1.z.enum(['Pending', 'In Progress', 'Completed', 'Overdue']).default('Pending'),
    start_date: zod_1.z.string(), // YYYY-MM-DD expected
    due_date: zod_1.z.string(),
    assigned_employee_id: zod_1.z.string().transform(v => v ? parseInt(v) : null).nullable().optional(),
}).refine(data => new Date(data.start_date) <= new Date(data.due_date), {
    message: "Due Date must not be earlier than Start Date",
    path: ["due_date"]
});
const updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']).optional(),
    status: zod_1.z.enum(['Pending', 'In Progress', 'Completed', 'Overdue']).optional(),
    start_date: zod_1.z.string().optional(),
    due_date: zod_1.z.string().optional(),
    assigned_employee_id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform(v => v ? parseInt(v.toString()) : null).nullable().optional(),
}).refine(data => {
    if (data.start_date && data.due_date) {
        return new Date(data.start_date) <= new Date(data.due_date);
    }
    return true;
}, {
    message: "Due Date must not be earlier than Start Date",
    path: ["due_date"]
});
const getUserIdByEmployeeId = async (empId) => {
    const [rows] = await db_1.default.query('SELECT user_id FROM employees WHERE id = ?', [empId]);
    if (rows.length === 0)
        return null;
    return rows[0].user_id;
};
const getTasks = async (req, res) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;
        if (!userRole || !userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (userRole === 'Admin') {
            const tasks = await Task_1.TaskModel.findAll();
            res.json(tasks);
        }
        else {
            const empId = await Task_1.TaskModel.getEmployeeIdByUserId(userId);
            if (!empId) {
                res.json([]);
                return;
            }
            const tasks = await Task_1.TaskModel.findAll({ assigned_employee_id: empId });
            res.json(tasks);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    try {
        // Check if it's multipart form data, body values will be strings
        const validatedData = createTaskSchema.parse(req.body);
        const taskData = {
            ...validatedData,
            assigned_employee_id: validatedData.assigned_employee_id || null,
            file_path: req.file ? `/uploads/${req.file.filename}` : null,
        };
        const taskId = await Task_1.TaskModel.create(taskData);
        // Create Notification if assigned
        if (taskData.assigned_employee_id) {
            const assignedUserId = await getUserIdByEmployeeId(taskData.assigned_employee_id);
            if (assignedUserId) {
                await Notification_1.NotificationModel.create({
                    user_id: assignedUserId,
                    message: `You have been assigned a new task: ${taskData.title}`,
                    type: 'assignment',
                    is_read: false
                });
            }
        }
        res.status(201).json({ message: 'Task created', id: taskId });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        else {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateTaskSchema.parse(req.body);
        const userRole = req.user?.role;
        const userId = req.user?.id;
        const task = await Task_1.TaskModel.findById(id);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        // Business Rule: Completed tasks cannot be edited
        if (task.status === 'Completed') {
            res.status(403).json({ message: 'Completed tasks cannot be edited' });
            return;
        }
        const updateData = { ...validatedData };
        if (req.file) {
            updateData.file_path = `/uploads/${req.file.filename}`;
        }
        if (userRole === 'Employee') {
            const empId = await Task_1.TaskModel.getEmployeeIdByUserId(userId);
            if (task.assigned_employee_id !== empId) {
                res.status(403).json({ message: 'Not authorized to edit this task' });
                return;
            }
            // Employees can only update status and file
            const allowedData = { status: updateData.status };
            if (updateData.file_path) {
                allowedData.file_path = updateData.file_path;
            }
            await Task_1.TaskModel.update(id, allowedData);
            if (allowedData.status === 'Completed' && task.status !== 'Completed') {
                // Fetch user name since it's not in the JWT token
                const [users] = await db_1.default.query('SELECT name FROM users WHERE id = ?', [req.user?.id]);
                const employeeName = users[0]?.name || 'Employee';
                // Notify admin that task is completed
                // For simplicity, we just find all admins and notify them
                const [admins] = await db_1.default.query('SELECT id FROM users WHERE role = "Admin"');
                for (const admin of admins) {
                    await Notification_1.NotificationModel.create({
                        user_id: admin.id,
                        message: `Task completed: ${task.title} by ${employeeName}`,
                        type: 'completion',
                        is_read: false
                    });
                }
            }
            res.json({ message: 'Task status updated' });
        }
        else {
            // Admin can update anything
            await Task_1.TaskModel.update(id, updateData);
            // Check if assignee changed
            if (updateData.assigned_employee_id && updateData.assigned_employee_id !== task.assigned_employee_id) {
                const assignedUserId = await getUserIdByEmployeeId(updateData.assigned_employee_id);
                if (assignedUserId) {
                    await Notification_1.NotificationModel.create({
                        user_id: assignedUserId,
                        message: `You have been assigned a task: ${updateData.title || task.title}`,
                        type: 'assignment',
                        is_read: false
                    });
                }
            }
            res.json({ message: 'Task updated' });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        else {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const success = await Task_1.TaskModel.delete(id);
        if (success) {
            res.json({ message: 'Task deleted' });
        }
        else {
            res.status(404).json({ message: 'Task not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteTask = deleteTask;
//# sourceMappingURL=taskController.js.map