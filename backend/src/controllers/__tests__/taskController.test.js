"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const taskController_1 = require("../taskController");
const Task_1 = require("../../models/Task");
const Notification_1 = require("../../models/Notification");
const db_1 = __importDefault(require("../../config/db"));
jest.mock('../../models/Task');
jest.mock('../../models/Notification');
jest.mock('../../config/db', () => ({
    query: jest.fn()
}));
describe('Task Controller', () => {
    let mockRequest;
    let mockResponse;
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
            await (0, taskController_1.getTasks)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
        it('should return all tasks for Admin', async () => {
            const mockTasks = [{ id: 1, title: 'Task 1' }];
            Task_1.TaskModel.findAll.mockResolvedValue(mockTasks);
            await (0, taskController_1.getTasks)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.findAll).toHaveBeenCalledWith();
            expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
        });
        it('should return empty array if Employee has no employee record', async () => {
            mockRequest.user = { id: 2, role: 'Employee' };
            Task_1.TaskModel.getEmployeeIdByUserId.mockResolvedValue(null);
            await (0, taskController_1.getTasks)(mockRequest, mockResponse);
            expect(mockResponse.json).toHaveBeenCalledWith([]);
        });
        it('should return assigned tasks for Employee', async () => {
            mockRequest.user = { id: 2, role: 'Employee' };
            const mockTasks = [{ id: 2, title: 'Task 2' }];
            Task_1.TaskModel.getEmployeeIdByUserId.mockResolvedValue(5);
            Task_1.TaskModel.findAll.mockResolvedValue(mockTasks);
            await (0, taskController_1.getTasks)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.findAll).toHaveBeenCalledWith({ assigned_employee_id: 5 });
            expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
        });
    });
    describe('createTask', () => {
        it('should return 400 for missing title', async () => {
            mockRequest.body = { description: 'desc', start_date: '2026-01-01', due_date: '2026-01-02' };
            await (0, taskController_1.createTask)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
        it('should return 400 if due date is before start date', async () => {
            mockRequest.body = { title: 'Test', start_date: '2026-01-02', due_date: '2026-01-01' };
            await (0, taskController_1.createTask)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
        it('should create task successfully without assignee', async () => {
            mockRequest.body = { title: 'Test', start_date: '2026-01-01', due_date: '2026-01-02' };
            Task_1.TaskModel.create.mockResolvedValue(10);
            await (0, taskController_1.createTask)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.create).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task created', id: 10 });
        });
        it('should create task and send notification if assigned to employee', async () => {
            mockRequest.body = { title: 'Test', start_date: '2026-01-01', due_date: '2026-01-02', assigned_employee_id: '5' };
            Task_1.TaskModel.create.mockResolvedValue(10);
            db_1.default.query.mockResolvedValue([[{ user_id: 2 }]]);
            Notification_1.NotificationModel.create.mockResolvedValue(true);
            await (0, taskController_1.createTask)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.create).toHaveBeenCalled();
            expect(db_1.default.query).toHaveBeenCalled(); // getUserIdByEmployeeId
            expect(Notification_1.NotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'assignment' }));
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });
    });
    describe('updateTask', () => {
        it('should return 404 if task not found', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'In Progress' };
            Task_1.TaskModel.findById.mockResolvedValue(null);
            await (0, taskController_1.updateTask)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
        });
        it('should return 403 if task is already completed', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'In Progress' };
            Task_1.TaskModel.findById.mockResolvedValue({ id: 1, status: 'Completed' });
            await (0, taskController_1.updateTask)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
        it('should return 403 if Employee tries to edit an unassigned task', async () => {
            mockRequest.user = { id: 2, role: 'Employee' };
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'In Progress' };
            Task_1.TaskModel.findById.mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: 99 });
            Task_1.TaskModel.getEmployeeIdByUserId.mockResolvedValue(5); // Employee is ID 5, but task is 99
            await (0, taskController_1.updateTask)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
        it('should update task status successfully for authorized Employee', async () => {
            mockRequest.user = { id: 2, role: 'Employee' };
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'In Progress' };
            Task_1.TaskModel.findById.mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: 5 });
            Task_1.TaskModel.getEmployeeIdByUserId.mockResolvedValue(5);
            await (0, taskController_1.updateTask)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.update).toHaveBeenCalledWith(1, { status: 'In Progress' });
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task status updated' });
        });
        it('should update task and notify admins if Employee completes the task', async () => {
            mockRequest.user = { id: 2, role: 'Employee' };
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'Completed' };
            Task_1.TaskModel.findById.mockResolvedValue({ id: 1, title: 'Task 1', status: 'Pending', assigned_employee_id: 5 });
            Task_1.TaskModel.getEmployeeIdByUserId.mockResolvedValue(5);
            db_1.default.query
                .mockResolvedValueOnce([[{ name: 'Employee Bob' }]]) // User query
                .mockResolvedValueOnce([[{ id: 1 }]]); // Admin query
            await (0, taskController_1.updateTask)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.update).toHaveBeenCalledWith(1, { status: 'Completed' });
            expect(Notification_1.NotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'completion' }));
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task status updated' });
        });
        it('should update task successfully for Admin', async () => {
            mockRequest.user = { id: 1, role: 'Admin' };
            mockRequest.params = { id: '1' };
            mockRequest.body = { title: 'New Title' };
            Task_1.TaskModel.findById.mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: null });
            await (0, taskController_1.updateTask)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.update).toHaveBeenCalledWith(1, { title: 'New Title' });
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task updated' });
        });
        it('should notify new assignee when Admin changes assigned_employee_id', async () => {
            mockRequest.user = { id: 1, role: 'Admin' };
            mockRequest.params = { id: '1' };
            mockRequest.body = { assigned_employee_id: 5 };
            Task_1.TaskModel.findById.mockResolvedValue({ id: 1, status: 'Pending', assigned_employee_id: null });
            db_1.default.query.mockResolvedValue([[{ user_id: 2 }]]);
            await (0, taskController_1.updateTask)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.update).toHaveBeenCalledWith(1, { assigned_employee_id: 5 });
            expect(Notification_1.NotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'assignment' }));
        });
    });
    describe('deleteTask', () => {
        it('should delete task successfully', async () => {
            mockRequest.params = { id: '1' };
            Task_1.TaskModel.delete.mockResolvedValue(true);
            await (0, taskController_1.deleteTask)(mockRequest, mockResponse);
            expect(Task_1.TaskModel.delete).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task deleted' });
        });
        it('should return 404 if task not found for deletion', async () => {
            mockRequest.params = { id: '99' };
            Task_1.TaskModel.delete.mockResolvedValue(false);
            await (0, taskController_1.deleteTask)(mockRequest, mockResponse);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task not found' });
        });
    });
});
//# sourceMappingURL=taskController.test.js.map