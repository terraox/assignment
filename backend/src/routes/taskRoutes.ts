import express from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.route('/')
  .get(protect, getTasks)
  .post(protect, adminOnly, upload.single('file'), createTask);

router.route('/:id')
  .put(protect, upload.single('file'), updateTask) // Controller handles role-based logic for updates
  .delete(protect, adminOnly, deleteTask);

export default router;
