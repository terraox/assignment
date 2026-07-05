"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    role: zod_1.z.enum(['Admin', 'Employee'])
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
    rememberMe: zod_1.z.boolean().optional()
});
const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        // Check if user exists
        const userExists = await User_1.UserModel.findByEmail(validatedData.email);
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Hash password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(validatedData.password, salt);
        // Create user
        const userId = await User_1.UserModel.create({
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            role: validatedData.role
        });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userId,
                name: validatedData.name,
                email: validatedData.email,
                role: validatedData.role
            }
        });
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
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const user = await User_1.UserModel.findByEmail(validatedData.email);
        if (!user || !user.password) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const isMatch = await bcrypt_1.default.compare(validatedData.password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate JWT
        // If rememberMe is true, expire in 30 days, else 1 day
        const expiresIn = validatedData.rememberMe ? '30d' : '1d';
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
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
exports.login = login;
//# sourceMappingURL=authController.js.map