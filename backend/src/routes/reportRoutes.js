"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
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
router.get('/', authMiddleware_1.protect, reportController_1.exportTasks);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map