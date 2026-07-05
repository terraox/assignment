import { Request, Response } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../taskController';
import { TaskModel } from '../../models/Task';
import { NotificationModel } from '../../models/Notification';
import pool from '../../config/db';
import { AuthRequest } from '../../middlewares/authMiddleware';

jest.mock('../../models/Task');
jest.mock('../../models/Notification');
jest.mock('../../config/db', () => ({
  query: jest.fn()
}));

describe('Task Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      user: { id: 1, role: 'Admin' }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return 401 if user is not authorized', async () => {
      mockRequest.user = undefined;
      await getTasks(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return all tasks for Admin', async () => {
      const mockTasks = [{ id: 1, title: 'Task 1' }];
      (TaskModel.findAll as jest.Mock).mockResolvedValue(mockTasks);
      
      await getTasks(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.findAll).toHaveBeenCalledWith();
      expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should return empty array if Employee has no employee record', async () => {
      mockRequest.user = { id: 2, role: 'Employee' };
      (TaskModel.getEmployeeIdByUserId as jest.Mock).mockResolvedValue(null);
      
      await getTasks(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('should return assigned tasks for Employee', async () => {
      mockRequest.user = { id: 2, role: 'Employee' };
      const mockTasks = [{ id: 2, title: 'Task 2' }];
      (TaskModel.getEmployeeIdByUserId as jest.Mock).mockResolvedValue(5);
      (TaskModel.findAll as jest.Mock).mockResolvedValue(mockTasks);
      
      await getTasks(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.findAll).toHaveBeenCalledWith({ assigned_employee_id: 5 });
      expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
    });
  });

  describe('createTask', () => {
    it('should return 400 for missing title', async () => {
      mockRequest.body = { description: 'desc', start_date: '2026-01-01', due_date: '2026-01-02' };
      await createTask(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if due date is before start date', async () => {
      mockRequest.body = { title: 'Test', start_date: '2026-01-02', due_date: '2026-01-01' };
      await createTask(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should create task successfully without assignee', async () => {
      mockRequest.body = { title: 'Test', start_date: '2026-01-01', due_date: '2026-01-02' };
      (TaskModel.create as jest.Mock).mockResolvedValue(10);
      
      await createTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task created', id: 10 });
    });

    it('should create task and send notification if assigned to employee', async () => {
      mockRequest.body = { title: 'Test', start_date: '2026-01-01', due_date: '2026-01-02', assigned_employee_id: '5' };
      (TaskModel.create as jest.Mock).mockResolvedValue(10);
      (pool.query as jest.Mock).mockResolvedValue([[{ user_id: 2 }]]);
      (NotificationModel.create as jest.Mock).mockResolvedValue(true);
      
      await createTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.create).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalled(); // getUserIdByEmployeeId
      expect(NotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'assignment' }));
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateTask', () => {
    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'In Progress' };
      (TaskModel.findById as jest.Mock).mockResolvedValue(null);
      
      await updateTask(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if task is already completed', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'In Progress' };
      (TaskModel.findById as jest.Mock).mockResolvedValue({ id: 1, status: 'Completed' });
      
      await updateTask(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 if Employee tries to edit an unassigned task', async () => {
      mockRequest.user = { id: 2, role: 'Employee' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'In Progress' };
      (TaskModel.findById as jest.Mock).mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: 99 });
      (TaskModel.getEmployeeIdByUserId as jest.Mock).mockResolvedValue(5); // Employee is ID 5, but task is 99
      
      await updateTask(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should update task status successfully for authorized Employee', async () => {
      mockRequest.user = { id: 2, role: 'Employee' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'In Progress' };
      (TaskModel.findById as jest.Mock).mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: 5 });
      (TaskModel.getEmployeeIdByUserId as jest.Mock).mockResolvedValue(5);
      
      await updateTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.update).toHaveBeenCalledWith(1, { status: 'In Progress' });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task status updated' });
    });

    it('should update task and notify admins if Employee completes the task', async () => {
      mockRequest.user = { id: 2, role: 'Employee' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'Completed' };
      (TaskModel.findById as jest.Mock).mockResolvedValue({ id: 1, title: 'Task 1', status: 'Pending', assigned_employee_id: 5 });
      (TaskModel.getEmployeeIdByUserId as jest.Mock).mockResolvedValue(5);
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{ name: 'Employee Bob' }]]) // User query
        .mockResolvedValueOnce([[{ id: 1 }]]); // Admin query
        
      await updateTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.update).toHaveBeenCalledWith(1, { status: 'Completed' });
      expect(NotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'completion' }));
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task status updated' });
    });

    it('should update task successfully for Admin', async () => {
      mockRequest.user = { id: 1, role: 'Admin' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { title: 'New Title' };
      (TaskModel.findById as jest.Mock).mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: null });
      
      await updateTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.update).toHaveBeenCalledWith(1, { title: 'New Title' });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task updated' });
    });

    it('should notify new assignee when Admin changes assigned_employee_id', async () => {
      mockRequest.user = { id: 1, role: 'Admin' };
      mockRequest.params = { id: '1' };
      mockRequest.body = { assigned_employee_id: 5 };
      (TaskModel.findById as jest.Mock).mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: null });
      (pool.query as jest.Mock).mockResolvedValue([[{ user_id: 2 }]]);
      
      await updateTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.update).toHaveBeenCalledWith(1, { assigned_employee_id: 5 });
      expect(NotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'assignment' }));
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      mockRequest.params = { id: '1' };
      (TaskModel.delete as jest.Mock).mockResolvedValue(true);
      
      await deleteTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(TaskModel.delete).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task deleted' });
    });

    it('should return 404 if task not found for deletion', async () => {
      mockRequest.params = { id: '99' };
      (TaskModel.delete as jest.Mock).mockResolvedValue(false);
      
      await deleteTask(mockRequest as AuthRequest, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });
  });
});
