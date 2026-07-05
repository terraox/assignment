"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getDepartments = exports.getEmployees = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const Employee_1 = require("../models/Employee");
// For Admin creating a new employee
const createEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    department: zod_1.z.string().min(1),
    designation: zod_1.z.string().min(1),
});
const updateEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    department: zod_1.z.string().min(1).optional(),
    designation: zod_1.z.string().min(1).optional(),
});
const validSortColumns = ['name', 'email', 'department', 'designation', 'created_at'];
const getEmployees = async (req, res) => {
    try {
        const search = req.query.search || '';
        const department = req.query.department || undefined;
        let sortBy = req.query.sortBy || 'e.id';
        const sortOrder = req.query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        // Map frontend column names to actual db columns
        if (validSortColumns.includes(sortBy)) {
            if (sortBy === 'name' || sortBy === 'email')
                sortBy = `u.${sortBy}`;
            else
                sortBy = `e.${sortBy}`;
        }
        else {
            sortBy = 'e.id';
        }
        const result = await Employee_1.EmployeeModel.findAll({ search, department, sortBy, sortOrder, page, limit });
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getEmployees = getEmployees;
const getDepartments = async (req, res) => {
    try {
        const departments = await Employee_1.EmployeeModel.getDistinctDepartments();
        res.json(departments);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getDepartments = getDepartments;
const createEmployee = async (req, res) => {
    try {
        const validatedData = createEmployeeSchema.parse(req.body);
        const userExists = await User_1.UserModel.findByEmail(validatedData.email);
        if (userExists) {
            res.status(400).json({ message: 'Email already in use' });
            return;
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(validatedData.password, salt);
        const userId = await User_1.UserModel.create({
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            role: 'Employee'
        });
        const empId = await Employee_1.EmployeeModel.create({
            user_id: userId,
            department: validatedData.department,
            designation: validatedData.designation
        });
        res.status(201).json({ message: 'Employee created', id: empId });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        else {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const validatedData = updateEmployeeSchema.parse(req.body);
        const employee = await Employee_1.EmployeeModel.findById(id);
        if (!employee) {
            res.status(404).json({ message: 'Employee not found' });
            return;
        }
        await Employee_1.EmployeeModel.update(id, {
            department: validatedData.department,
            designation: validatedData.designation
        });
        // We don't update user email here easily because it might clash, 
        // but we can update name in users table if needed.
        // For simplicity, we just update department and designation.
        res.json({ message: 'Employee updated' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        else {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const success = await Employee_1.EmployeeModel.delete(id);
        if (success) {
            res.json({ message: 'Employee deleted' });
        }
        else {
            res.status(404).json({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteEmployee = deleteEmployee;
//# sourceMappingURL=employeeController.js.map