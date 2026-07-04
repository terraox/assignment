import express from 'express';
import { getAdminDashboard, getEmployeeDashboard } from '../controllers/dashboardController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/admin', protect, adminOnly, getAdminDashboard);
router.get('/employee', protect, getEmployeeDashboard);

export default router;
