"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportTasks = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const db_1 = __importDefault(require("../config/db"));
const mysql2_1 = require("mysql2");
const exceljs_1 = __importDefault(require("exceljs"));
const json2csv_1 = require("json2csv");
const Task_1 = require("../models/Task");
const exportTasks = async (req, res) => {
    try {
        const format = req.query.format || 'csv';
        const userRole = req.user?.role;
        const userId = req.user?.id;
        let query = `
      SELECT t.id, t.title, t.priority, t.status, t.start_date, t.due_date, u.name as assigned_to
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
    `;
        const params = [];
        if (userRole === 'Employee') {
            const empId = await Task_1.TaskModel.getEmployeeIdByUserId(userId);
            query += ` WHERE t.assigned_employee_id = ?`;
            params.push(empId);
        }
        query += ` ORDER BY t.due_date ASC`;
        const [rows] = await db_1.default.query(query, params);
        // Format dates to string for better export
        const data = rows.map(row => ({
            ...row,
            start_date: new Date(row.start_date).toLocaleDateString(),
            due_date: new Date(row.due_date).toLocaleDateString()
        }));
        if (format === 'excel') {
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet('Tasks Report');
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Title', key: 'title', width: 30 },
                { header: 'Priority', key: 'priority', width: 15 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Start Date', key: 'start_date', width: 15 },
                { header: 'Due Date', key: 'due_date', width: 15 },
                { header: 'Assigned To', key: 'assigned_to', width: 25 },
            ];
            worksheet.addRows(data);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=tasks_report.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
        else {
            // Default to CSV
            const fields = ['id', 'title', 'priority', 'status', 'start_date', 'due_date', 'assigned_to'];
            const json2csvParser = new json2csv_1.Parser({ fields });
            const csv = json2csvParser.parse(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=tasks_report.csv');
            res.status(200).send(csv);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during export' });
    }
};
exports.exportTasks = exportTasks;
//# sourceMappingURL=reportController.js.map