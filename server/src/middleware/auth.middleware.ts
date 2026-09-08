import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User, IUser } from '../models/User';
import { AppError } from './error.middleware';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized to access this route. No token provided.', 401);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
