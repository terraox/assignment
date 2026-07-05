"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employeeController_1 = require("../controllers/employeeController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.route('/departments').get(authMiddleware_1.protect, authMiddleware_1.adminOnly, employeeController_1.getDepartments);
router.route('/')
    .get(authMiddleware_1.protect, authMiddleware_1.adminOnly, employeeController_1.getEmployees)
    .post(authMiddleware_1.protect, authMiddleware_1.adminOnly, employeeController_1.createEmployee);
router.route('/:id')
    .put(authMiddleware_1.protect, authMiddleware_1.adminOnly, employeeController_1.updateEmployee)
    .delete(authMiddleware_1.protect, authMiddleware_1.adminOnly, employeeController_1.deleteEmployee);
exports.default = router;
//# sourceMappingURL=employeeRoutes.js.map