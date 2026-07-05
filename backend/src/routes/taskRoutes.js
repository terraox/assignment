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
router.route('/')
    .get(authMiddleware_1.protect, taskController_1.getTasks)
    .post(authMiddleware_1.protect, authMiddleware_1.adminOnly, uploadMiddleware_1.upload.single('file'), taskController_1.createTask);
router.route('/:id')
    .put(authMiddleware_1.protect, uploadMiddleware_1.upload.single('file'), taskController_1.updateTask) // Controller handles role-based logic for updates
    .delete(authMiddleware_1.protect, authMiddleware_1.adminOnly, taskController_1.deleteTask);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map