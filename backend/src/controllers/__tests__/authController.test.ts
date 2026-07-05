import { Request, Response } from 'express';
import { register, login } from '../authController';
import { UserModel } from '../../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../../models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
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

      await register(mockRequest as Request, mockResponse as Response);

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
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({ id: 1, email: 'test@example.com' });

      await register(mockRequest as Request, mockResponse as Response);

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
      
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (UserModel.create as jest.Mock).mockResolvedValue(1); // new user ID

      await register(mockRequest as Request, mockResponse as Response);

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

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'Password1!' };
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return 401 if password does not match', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'Password1!' };
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({ id: 1, password: 'hashedPassword' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return token and user data on successful login', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'Password1!', rememberMe: true };
      
      const fakeUser = { id: 1, email: 'test@example.com', name: 'Test', role: 'Employee', password: 'hashedPassword' };
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(fakeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('fake-jwt-token');

      await login(mockRequest as Request, mockResponse as Response);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: fakeUser.id, role: fakeUser.role },
        expect.any(String),
        { expiresIn: '30d' }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Login successful',
        token: 'fake-jwt-token'
      }));
    });
  });
});
