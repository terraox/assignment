import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Employee {
  id?: number;
  user_id: number;
  department: string;
  designation: string;
  name?: string;
  email?: string;
  created_at?: string;
}

interface FetchOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  department?: string;
}

export class EmployeeModel {
  static async findAll(options: FetchOptions = {}): Promise<{ data: Employee[], total: number }> {
    const {
      search = '',
      sortBy = 'e.id',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
      department
    } = options;

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

    const queryParams: any[] = [];
    const whereClauses: string[] = [];

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
    
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, queryParams);
    const total = countRows[0].total as number;

    const [rows] = await pool.query<RowDataPacket[]>(baseQuery, [...queryParams, limit, offset]);

    return { data: rows as Employee[], total };
  }

  static async findById(id: number): Promise<Employee | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT e.id, e.user_id, e.department, e.designation, u.name, u.email, e.created_at
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0] as Employee;
  }

  static async create(employee: Employee): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO employees (user_id, department, designation) VALUES (?, ?, ?)',
      [employee.user_id, employee.department, employee.designation]
    );
    return result.insertId;
  }

  static async update(id: number, data: Partial<Employee>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.department !== undefined) {
      fields.push('department = ?');
      values.push(data.department);
    }
    if (data.designation !== undefined) {
      fields.push('designation = ?');
      values.push(data.designation);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM employees WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getDistinctDepartments(): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != "" ORDER BY department ASC');
    return rows.map(r => r.department);
  }
}
