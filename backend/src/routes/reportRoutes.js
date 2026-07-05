"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// Both roles can export their tasks (Admin gets all, Employee gets theirs)
router.get('/', authMiddleware_1.protect, reportController_1.exportTasks);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map