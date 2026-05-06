import { Request, Response, NextFunction } from 'express';

export const roleGuard = (allowedRoles: Array<'owner' | 'manager' | 'staff'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 401, message: 'Unauthorized' } });
    }

    if (!allowedRoles.includes(req.user.role as 'owner' | 'manager' | 'staff')) {
      return res.status(403).json({ success: false, error: { code: 403, message: 'Forbidden: Insufficient privileges' } });
    }

    next();
  };
};
