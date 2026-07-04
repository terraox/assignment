import express from 'express';
import { getAdminDashboard, getEmployeeDashboard, getEmployeeHistory, getEmployeeStats } from '../controllers/dashboardController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/admin', protect, adminOnly, getAdminDashboard);
router.get('/employee', protect, getEmployeeDashboard);
router.get('/employee-stats', protect, adminOnly, getEmployeeStats);
router.get('/employee/:id/history', protect, adminOnly, getEmployeeHistory);

export default router;
