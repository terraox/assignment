import { Response, NextFunction } from 'express';
import { protect, adminOnly, AuthRequest } from '../authMiddleware';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

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
      protect(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      protect(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() and set req.user if token is valid', () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue({ id: 1, role: 'Admin' });

      protect(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual({ id: 1, role: 'Admin' });
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('adminOnly', () => {
    it('should call next() if user is Admin', () => {
      mockRequest.user = { id: 1, role: 'Admin' };

      adminOnly(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user is not Admin', () => {
      mockRequest.user = { id: 2, role: 'Employee' };

      adminOnly(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized as an Admin' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
