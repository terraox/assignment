"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env' });
async function populate() {
    const connection = await promise_1.default.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'assignment_db'
    });
    // 1. Get all users with role 'Employee'
    const [users] = await connection.query('SELECT id, name, email FROM users WHERE role = "Employee"');
    if (users.length === 0) {
        console.log('No employee users found.');
        process.exit(0);
    }
    console.log(`Found ${users.length} employee users.`);
    for (const user of users) {
        // 2. Check if they have an employee record
        const [existingEmp] = await connection.query('SELECT id FROM employees WHERE user_id = ?', [user.id]);
        let empId;
        if (existingEmp.length === 0) {
            // Create employee record
            const [result] = await connection.query('INSERT INTO employees (user_id, department, designation) VALUES (?, ?, ?)', [user.id, 'Engineering', 'Software Engineer']);
            empId = result.insertId;
            console.log(`Created employee record for ${user.name} (empId: ${empId})`);
        }
        else {
            empId = existingEmp[0].id;
            console.log(`Employee record already exists for ${user.name} (empId: ${empId})`);
        }
        // 3. Create dummy tasks for this employee
        console.log(`Creating dummy tasks for employee ${empId}...`);
        const tasks = [
            {
                title: 'Complete Onboarding',
                priority: 'High',
                status: 'Completed',
                start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
                due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
                completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // On time
            },
            {
                title: 'Setup Environment',
                priority: 'Medium',
                status: 'Completed',
                start_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // Late
            },
            {
                title: 'First Pull Request',
                priority: 'High',
                status: 'In Progress',
                start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completed_at: null
            },
            {
                title: 'Review Documentation',
                priority: 'Low',
                status: 'Pending',
                start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completed_at: null
            },
            {
                title: 'Complete Security Training',
                priority: 'High',
                status: 'Overdue',
                start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                completed_at: null
            }
        ];
        for (const t of tasks) {
            await connection.query('INSERT INTO tasks (title, description, priority, status, start_date, due_date, assigned_employee_id, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [t.title, 'Dummy description', t.priority, t.status, t.start_date, t.due_date, empId, t.completed_at]);
        }
        console.log(`Finished adding 5 dummy tasks for ${user.name}`);
    }
    process.exit(0);
}
populate().catch(console.error);
//# sourceMappingURL=populateDummyData.js.map