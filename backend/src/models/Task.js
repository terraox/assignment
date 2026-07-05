"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
const db_1 = __importDefault(require("../config/db"));
const mysql2_1 = require("mysql2");
class TaskModel {
    static async findAll(options = {}) {
        let query = `
      SELECT t.*, u.name as assigned_employee_name 
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
    `;
        const params = [];
        if (options.assigned_employee_id) {
            query += ` WHERE t.assigned_employee_id = ?`;
            params.push(options.assigned_employee_id);
        }
        query += ` ORDER BY t.due_date ASC`;
        const [rows] = await db_1.default.query(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await db_1.default.query(`SELECT t.*, u.name as assigned_employee_name 
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_employee_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE t.id = ?`, [id]);
        if (rows.length === 0)
            return null;
        return rows[0];
    }
    static async create(task) {
        const [result] = await db_1.default.query(`INSERT INTO tasks (title, description, priority, status, start_date, due_date, assigned_employee_id, file_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            task.title,
            task.description || null,
            task.priority,
            task.status,
            task.start_date,
            task.due_date,
            task.assigned_employee_id,
            task.file_path || null
        ]);
        return result.insertId;
    }
    static async update(id, data) {
        const fields = [];
        const values = [];
        const updatableFields = [
            'title', 'description', 'priority', 'status',
            'start_date', 'due_date', 'assigned_employee_id', 'file_path'
        ];
        updatableFields.forEach((field) => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });
        if (fields.length === 0)
            return true;
        values.push(id);
        const [result] = await db_1.default.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
        return result.affectedRows > 0;
    }
    static async delete(id) {
        const [result] = await db_1.default.query('DELETE FROM tasks WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    static async getEmployeeIdByUserId(userId) {
        const [rows] = await db_1.default.query('SELECT id FROM employees WHERE user_id = ?', [userId]);
        if (rows.length === 0)
            return null;
        return rows[0].id;
    }
}
exports.TaskModel = TaskModel;
//# sourceMappingURL=Task.js.map