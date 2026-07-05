import express from 'express';
import { exportTasks } from '../controllers/reportController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Task export and reporting endpoints
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Export tasks as CSV or Excel
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         required: true
 *         description: Format of the report to generate
 *     responses:
 *       200:
 *         description: A downloadable file (CSV or XLSX)
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid format parameter
 *       401:
 *         description: Unauthorized
 */
// Both roles can export their tasks (Admin gets all, Employee gets theirs)
router.get('/', protect, exportTasks);

export default router;
