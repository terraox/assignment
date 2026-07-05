import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        role: string;
    };
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const adminOnly: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map