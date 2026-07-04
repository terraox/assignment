import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Employee';
  created_at?: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return rows[0] as User;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rows[0] as User;
  }

  static async create(user: User): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [user.name, user.email, user.password, user.role]
    );
    return result.insertId;
  }
}
