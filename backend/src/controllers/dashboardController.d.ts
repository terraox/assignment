import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare const getAdminDashboard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEmployeeDashboard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEmployeeHistory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getEmployeeStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=dashboardController.d.ts.map