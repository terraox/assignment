import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Task {
  id?: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  start_date: string;
  due_date: string;
  assigned_employee_id: number | null;
  file_path?: string;
  created_at?: string;
  // joined fields
  assigned_employee_name?: string;
}

interface FetchOptions {
  assigned_employee_id?: number;
}

export class TaskModel {
  static async findAll(options: FetchOptions = {}): Promise<Task[]> {
    let query = `
      SELECT t.*, u.name as assigned_employee_name 
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
    `;
    const params: any[] = [];

    if (options.assigned_employee_id) {
      query += ` WHERE t.assigned_employee_id = ?`;
      params.push(options.assigned_employee_id);
    }

    query += ` ORDER BY t.due_date ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows as Task[];
  }

  static async findById(id: number): Promise<Task | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, u.name as assigned_employee_name 
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_employee_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0] as Task;
  }

  static async create(task: Task): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tasks (title, description, priority, status, start_date, due_date, assigned_employee_id, file_path) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.title,
        task.description || null,
        task.priority,
        task.status,
        task.start_date,
        task.due_date,
        task.assigned_employee_id,
        task.file_path || null
      ]
    );
    return result.insertId;
  }

  static async update(id: number, data: Partial<Task>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    const updatableFields = [
      'title', 'description', 'priority', 'status', 
      'start_date', 'due_date', 'assigned_employee_id', 'file_path'
    ] as const;

    updatableFields.forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM tasks WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getEmployeeIdByUserId(userId: number): Promise<number | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM employees WHERE user_id = ?',
      [userId]
    );
    if (rows.length === 0) return null;
    return rows[0].id as number;
  }
}
