"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authController_1 = require("../authController");
const User_1 = require("../../models/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('../../models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
describe('Auth Controller', () => {
    let mockRequest;
    let mockResponse;
    let responseObject = {};
    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((result) => {
                responseObject = result;
            })
        };
        jest.clearAllMocks();
    });
    describe('Register', () => {
        it('should return 400 if validation fails (missing fields)', async () => {
            mockRequest.body = { email: 'test@example.com' }; // Missing name, password, role
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation error' }));
        });
        it('should return 400 if user already exists', async () => {
            mockRequest.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password1!',
                role: 'Employee'
            };
            User_1.UserModel.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User already exists' });
        });
        it('should successfully register a new user', async () => {
            mockRequest.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password1!',
                role: 'Employee'
            };
            User_1.UserModel.findByEmail.mockResolvedValue(null);
            bcrypt_1.default.genSalt.mockResolvedValue('salt');
            bcrypt_1.default.hash.mockResolvedValue('hashedPassword');
            User_1.UserModel.create.mockResolvedValue(1); // new user ID
            await (0, authController_1.register)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User registered successfully',
                user: expect.any(Object)
            }));
        });
    });
    describe('Login', () => {
        it('should return 400 for invalid credentials schema', async () => {
            mockRequest.body = { email: 'notanemail' };
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
        it('should return 401 if user not found', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'Password1!' };
            User_1.UserModel.findByEmail.mockResolvedValue(null);
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
        it('should return 401 if password does not match', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'Password1!' };
            User_1.UserModel.findByEmail.mockResolvedValue({ id: 1, password: 'hashedPassword' });
            bcrypt_1.default.compare.mockResolvedValue(false);
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
        it('should return token and user data on successful login', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'Password1!', rememberMe: true };
            const fakeUser = { id: 1, email: 'test@example.com', name: 'Test', role: 'Employee', password: 'hashedPassword' };
            User_1.UserModel.findByEmail.mockResolvedValue(fakeUser);
            bcrypt_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue('fake-jwt-token');
            await (0, authController_1.login)(mockRequest, mockResponse);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: fakeUser.id, role: fakeUser.role }, expect.any(String), { expiresIn: '30d' });
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Login successful',
                token: 'fake-jwt-token'
            }));
        });
    });
});
//# sourceMappingURL=authController.test.js.map