"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboardController_1 = require("../controllers/dashboardController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.get('/admin', authMiddleware_1.protect, authMiddleware_1.adminOnly, dashboardController_1.getAdminDashboard);
router.get('/employee', authMiddleware_1.protect, dashboardController_1.getEmployeeDashboard);
router.get('/employee-stats', authMiddleware_1.protect, authMiddleware_1.adminOnly, dashboardController_1.getEmployeeStats);
router.get('/employee/:id/history', authMiddleware_1.protect, authMiddleware_1.adminOnly, dashboardController_1.getEmployeeHistory);
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map