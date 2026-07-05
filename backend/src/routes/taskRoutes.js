"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const taskController_1 = require("../controllers/taskController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks (Admin) or assigned tasks (Employee)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new task (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - start_date
 *               - due_date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed, Overdue]
 *               start_date:
 *                 type: string
 *                 format: date
 *               due_date:
 *                 type: string
 *                 format: date
 *               assigned_employee_id:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized as Admin
 */
router.route('/')
    .get(authMiddleware_1.protect, taskController_1.getTasks)
    .post(authMiddleware_1.protect, authMiddleware_1.adminOnly, uploadMiddleware_1.upload.single('file'), taskController_1.createTask);
/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed, Overdue]
 *               start_date:
 *                 type: string
 *                 format: date
 *               due_date:
 *                 type: string
 *                 format: date
 *               assigned_employee_id:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: Not authorized to edit this task
 *       404:
 *         description: Task not found
 *   delete:
 *     summary: Delete a task (Admin only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Not authorized as Admin
 *       404:
 *         description: Task not found
 */
router.route('/:id')
    .put(authMiddleware_1.protect, uploadMiddleware_1.upload.single('file'), taskController_1.updateTask) // Controller handles role-based logic for updates
    .delete(authMiddleware_1.protect, authMiddleware_1.adminOnly, taskController_1.deleteTask);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map