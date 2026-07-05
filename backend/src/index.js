"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const swagger_1 = require("./config/swagger");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5001;
// Setup Swagger API Documentation
(0, swagger_1.setupSwagger)(app);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve uploaded files statically
app.use('/uploads', express_1.default.static('uploads'));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/employees', employeeRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.get('/api/health', async (req, res) => {
    try {
        await db_1.default.query('SELECT 1 + 1 AS result');
        res.json({ status: 'ok', message: 'Backend is running and DB is connected' });
    }
    catch (error) {
        console.error('Database connection failed', error);
        res.status(500).json({ status: 'error', message: 'DB connection failed' });
    }
});
const node_cron_1 = __importDefault(require("node-cron"));
const Notification_1 = require("./models/Notification");
// Schedule job to run daily at 9:00 AM to check for tasks due tomorrow
node_cron_1.default.schedule('0 9 * * *', async () => {
    try {
        console.log('Running daily check for tasks due tomorrow...');
        const [tasks] = await db_1.default.query(`
      SELECT t.id, t.title, t.assigned_employee_id, e.user_id 
      FROM tasks t
      JOIN employees e ON t.assigned_employee_id = e.id
      WHERE t.status != 'Completed' 
      AND DATE(t.due_date) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
    `);
        for (const task of tasks) {
            if (task.user_id) {
                await Notification_1.NotificationModel.create({
                    user_id: task.user_id,
                    message: `Reminder: Your task "${task.title}" is due tomorrow!`,
                    type: 'reminder',
                    is_read: false
                });
            }
        }
        console.log(`Sent reminders for ${tasks.length} tasks.`);
    }
    catch (error) {
        console.error('Error in cron job', error);
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map