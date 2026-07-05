"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.protect = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'supersecretkey');
            req.user = {
                id: decoded.id,
                role: decoded.role
            };
            next();
        }
        catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.protect = protect;
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    }
    else {
        res.status(403).json({ message: 'Not authorized as an Admin' });
    }
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=authMiddleware.js.map