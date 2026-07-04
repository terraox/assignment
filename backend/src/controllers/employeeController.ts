import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { UserModel } from '../models/User';
import { EmployeeModel } from '../models/Employee';

// For Admin creating a new employee
const createEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().min(1),
  designation: z.string().min(1),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().min(1).optional(),
  designation: z.string().min(1).optional(),
});

const validSortColumns = ['name', 'email', 'department', 'designation', 'created_at'];

export const getEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string || '';
    const department = req.query.department as string || undefined;
    let sortBy = req.query.sortBy as string || 'e.id';
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Map frontend column names to actual db columns
    if (validSortColumns.includes(sortBy)) {
      if (sortBy === 'name' || sortBy === 'email') sortBy = `u.${sortBy}`;
      else sortBy = `e.${sortBy}`;
    } else {
      sortBy = 'e.id';
    }

    const result = await EmployeeModel.findAll({ search, department, sortBy, sortOrder, page, limit });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await EmployeeModel.getDistinctDepartments();
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createEmployeeSchema.parse(req.body);

    const userExists = await UserModel.findByEmail(validatedData.email);
    if (userExists) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const userId = await UserModel.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: 'Employee'
    });

    const empId = await EmployeeModel.create({
      user_id: userId,
      department: validatedData.department,
      designation: validatedData.designation
    });

    res.status(201).json({ message: 'Employee created', id: empId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = updateEmployeeSchema.parse(req.body);

    const employee = await EmployeeModel.findById(id);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    await EmployeeModel.update(id, {
      department: validatedData.department,
      designation: validatedData.designation
    });

    // We don't update user email here easily because it might clash, 
    // but we can update name in users table if needed.
    // For simplicity, we just update department and designation.

    res.json({ message: 'Employee updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const success = await EmployeeModel.delete(id);
    if (success) {
      res.json({ message: 'Employee deleted' });
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
