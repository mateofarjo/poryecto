import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt';
import { userRepository } from '../repositories/UserRepository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'user' | 'admin';
    email: string;
    name: string;
    status: 'inactive' | 'active';
  };
}

// Verifica el token contra la base para reflejar suspensiones o cambios de rol al instante.
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyAuthToken(token);
    const principal = await userRepository.findById(payload.sub);

    if (!principal) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (principal.status !== 'active') {
      return res.status(403).json({ message: 'User inactive' });
    }

    req.user = {
      id: principal.id,
      role: principal.role,
      email: principal.email,
      name: principal.name,
      status: principal.status,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
}
