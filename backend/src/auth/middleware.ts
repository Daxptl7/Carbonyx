import { NextFunction, Request, Response } from 'express';
import { verifySessionToken } from './session';
import { ProtocolRole } from './types';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  res.locals.auth = session;
  return next();
}

export function requireRoles(...roles: ProtocolRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, () => {
      if (!roles.includes(res.locals.auth.role)) {
        return res.status(403).json({
          error: 'Your protocol role cannot perform this action',
          code: 'ROLE_FORBIDDEN',
          requiredRoles: roles
        });
      }
      return next();
    });
  };
}
