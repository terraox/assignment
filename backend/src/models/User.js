"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const db_1 = __importDefault(require("../config/db"));
class UserModel {
    static async findByEmail(email) {
        const [rows] = await db_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0)
            return null;
        return rows[0];
    }
    static async findById(id) {
        const [rows] = await db_1.default.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
        return rows[0];
    }
    static async create(user) {
        const [result] = await db_1.default.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [user.name, user.email, user.password, user.role]);
        return result.insertId;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map