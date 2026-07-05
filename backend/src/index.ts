import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import taskRoutes from './routes/taskRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', message: 'Backend is running and DB is connected' });
  } catch (error) {
    console.error('Database connection failed', error);
    res.status(500).json({ status: 'error', message: 'DB connection failed' });
  }
});
import cron from 'node-cron';
import { NotificationModel } from './models/Notification';
import { RowDataPacket } from 'mysql2';

// Schedule job to run daily at 9:00 AM to check for tasks due tomorrow
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('Running daily check for tasks due tomorrow...');
    const [tasks] = await pool.query<RowDataPacket[]>(`
      SELECT t.id, t.title, t.assigned_employee_id, e.user_id 
      FROM tasks t
      JOIN employees e ON t.assigned_employee_id = e.id
      WHERE t.status != 'Completed' 
      AND DATE(t.due_date) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
    `);

    for (const task of tasks) {
      if (task.user_id) {
        await NotificationModel.create({
          user_id: task.user_id,
          message: `Reminder: Your task "${task.title}" is due tomorrow!`,
          type: 'reminder',
          is_read: false
        });
      }
    }
    console.log(`Sent reminders for ${tasks.length} tasks.`);
  } catch (error) {
    console.error('Error in cron job', error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
