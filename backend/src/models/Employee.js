"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeModel = void 0;
const db_1 = __importDefault(require("../config/db"));
const mysql2_1 = require("mysql2");
class EmployeeModel {
    static async findAll(options = {}) {
        const { search = '', sortBy = 'e.id', sortOrder = 'DESC', page = 1, limit = 10, department } = options;
        const offset = (page - 1) * limit;
        let baseQuery = `
      SELECT e.id, e.user_id, e.department, e.designation, u.name, u.email, e.created_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
    `;
        let countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      JOIN users u ON e.user_id = u.id
    `;
        const queryParams = [];
        const whereClauses = [];
        if (search) {
            whereClauses.push(`(u.name LIKE ? OR u.email LIKE ? OR e.department LIKE ?)`);
            const searchStr = `%${search}%`;
            queryParams.push(searchStr, searchStr, searchStr);
        }
        if (department) {
            whereClauses.push(`e.department = ?`);
            queryParams.push(department);
        }
        if (whereClauses.length > 0) {
            const whereString = ` WHERE ${whereClauses.join(' AND ')}`;
            baseQuery += whereString;
            countQuery += whereString;
        }
        // Add sorting (using string interpolation for order by is safe if we strictly validate sortBy beforehand)
        baseQuery += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
        const [countRows] = await db_1.default.query(countQuery, queryParams);
        const total = countRows[0].total;
        const [rows] = await db_1.default.query(baseQuery, [...queryParams, limit, offset]);
        return { data: rows, total };
    }
    static async findById(id) {
        const [rows] = await db_1.default.query(`SELECT e.id, e.user_id, e.department, e.designation, u.name, u.email, e.created_at
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`, [id]);
        if (rows.length === 0)
            return null;
        return rows[0];
    }
    static async create(employee) {
        const [result] = await db_1.default.query('INSERT INTO employees (user_id, department, designation) VALUES (?, ?, ?)', [employee.user_id, employee.department, employee.designation]);
        return result.insertId;
    }
    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.department !== undefined) {
            fields.push('department = ?');
            values.push(data.department);
        }
        if (data.designation !== undefined) {
            fields.push('designation = ?');
            values.push(data.designation);
        }
        if (fields.length === 0)
            return true;
        values.push(id);
        const [result] = await db_1.default.query(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`, values);
        return result.affectedRows > 0;
    }
    static async delete(id) {
        const [result] = await db_1.default.query('DELETE FROM employees WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    static async getDistinctDepartments() {
        const [rows] = await db_1.default.query('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != "" ORDER BY department ASC');
        return rows.map(r => r.department);
    }
}
exports.EmployeeModel = EmployeeModel;
//# sourceMappingURL=Employee.js.map