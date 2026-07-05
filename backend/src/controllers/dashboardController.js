"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployeeStats = exports.getEmployeeHistory = exports.getEmployeeDashboard = exports.getAdminDashboard = void 0;
const db_1 = __importDefault(require("../config/db"));
const Task_1 = require("../models/Task");
const getAdminDashboard = async (req, res) => {
    try {
        const [empCount] = await db_1.default.query('SELECT COUNT(*) as total FROM employees');
        const [taskStats] = await db_1.default.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
    `);
        const [employeeStats] = await db_1.default.query(`
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
        const [recentTasks] = await db_1.default.query(`
      SELECT 
        t.id, t.title, t.status, t.due_date, t.completed_at, 
        u.name as assigned_to
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `);
        // Generate last 7 days chart data for Velocity (Assigned vs Completed)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            // Count tasks assigned on this date
            const [assigned] = await db_1.default.query(`
        SELECT COUNT(*) as count FROM tasks WHERE DATE(created_at) = ?
      `, [dateStr]);
            // Count tasks completed on this date
            const [completed] = await db_1.default.query(`
        SELECT COUNT(*) as count FROM tasks WHERE DATE(completed_at) = ? AND status = 'Completed'
      `, [dateStr]);
            chartData.push({
                name: dayName,
                assigned: assigned[0].count,
                completed: completed[0].count
            });
        }
        res.json({
            totalEmployees: empCount[0].total,
            totalTasks: taskStats[0].total_tasks || 0,
            completedTasks: taskStats[0].completed_tasks || 0,
            pendingTasks: taskStats[0].pending_tasks || 0,
            inProgressTasks: taskStats[0].in_progress_tasks || 0,
            overdueTasks: taskStats[0].overdue_tasks || 0,
            employeeStats: employeeStats,
            recentTasks: recentTasks,
            chartData: chartData,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAdminDashboard = getAdminDashboard;
const getEmployeeDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const empId = await Task_1.TaskModel.getEmployeeIdByUserId(userId);
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
        const [employeeInfo] = await db_1.default.query(`
      SELECT u.name, u.email, e.department, e.designation
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [empId]);
        const [taskStats] = await db_1.default.query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
      WHERE assigned_employee_id = ?
    `, [empId]);
        const [tasks] = await db_1.default.query(`
      SELECT id, title, priority, status, start_date, due_date, completed_at, file_path
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getEmployeeDashboard = getEmployeeDashboard;
const getEmployeeHistory = async (req, res) => {
    try {
        const empId = req.params.id;
        const [employeeInfo] = await db_1.default.query(`
      SELECT u.name, u.email, e.department, e.designation
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `, [empId]);
        if (!employeeInfo.length) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        const [tasks] = await db_1.default.query(`
      SELECT id, title, priority, status, start_date, due_date, completed_at
      FROM tasks
      WHERE assigned_employee_id = ?
      ORDER BY created_at DESC
    `, [empId]);
        res.json({
            employee: employeeInfo[0],
            tasks: tasks
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getEmployeeHistory = getEmployeeHistory;
const getEmployeeStats = async (req, res) => {
    try {
        const [employeeStats] = await db_1.default.query(`
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getEmployeeStats = getEmployeeStats;
//# sourceMappingURL=dashboardController.js.map