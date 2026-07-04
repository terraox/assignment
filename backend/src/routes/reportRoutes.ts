import express from 'express';
import { exportTasks } from '../controllers/reportController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Both roles can export their tasks (Admin gets all, Employee gets theirs)
router.get('/', protect, exportTasks);

export default router;
