"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware_1 = require("../authMiddleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
jest.mock('jsonwebtoken');
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction = jest.fn();
    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });
    describe('protect', () => {
        it('should return 401 if no token provided', () => {
            (0, authMiddleware_1.protect)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 if token is invalid', () => {
            mockRequest.headers = { authorization: 'Bearer invalid-token' };
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            (0, authMiddleware_1.protect)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should call next() and set req.user if token is valid', () => {
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            jsonwebtoken_1.default.verify.mockReturnValue({ id: 1, role: 'Admin' });
            (0, authMiddleware_1.protect)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toEqual({ id: 1, role: 'Admin' });
            expect(nextFunction).toHaveBeenCalled();
        });
    });
    describe('adminOnly', () => {
        it('should call next() if user is Admin', () => {
            mockRequest.user = { id: 1, role: 'Admin' };
            (0, authMiddleware_1.adminOnly)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should return 403 if user is not Admin', () => {
            mockRequest.user = { id: 2, role: 'Employee' };
            (0, authMiddleware_1.adminOnly)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized as an Admin' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=authMiddleware.test.js.map