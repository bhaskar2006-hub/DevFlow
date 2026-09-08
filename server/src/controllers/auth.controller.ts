import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export class AuthController {
  public static async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
      }

      const result = await AuthService.register({ name, email, password });
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await AuthService.login({ email, password });
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async googleLogin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken, email, name, avatar } = req.body;

      if (!idToken && !email) {
        throw new AppError('Either Google idToken or email is required', 400);
      }

      const result = await AuthService.googleLogin({ idToken, email, name, avatar });
      res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const profile = await AuthService.getProfile(req.user._id.toString());
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { name, avatar } = req.body;
      const updatedUser = await AuthService.updateProfile(req.user._id.toString(), {
        name,
        avatar,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}
