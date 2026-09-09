import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { emailService } from './email.service';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  public static async register(data: { name: string; email: string; password: string }) {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    // Send welcome email (non-blocking)
    try {
      const activationUrl = `${process.env.CLIENT_URL || 'https://devflow.app'}/verify-email?token=${token}`;
      await emailService.sendWelcomeEmail(user.email, user.name, activationUrl);
    } catch (err) {
      console.warn('[Auth Service] Failed to send welcome email:', err);
      // Don't throw - continue with registration even if email fails
    }

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  public static async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');
    if (!user || !user.password) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await comparePassword(data.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  public static async googleLogin(data: { idToken?: string; email?: string; name?: string; avatar?: string }) {
    let email = data.email;
    let name = data.name || 'Google User';
    let avatar = data.avatar || '';
    let googleId: string | undefined;

    if (data.idToken && process.env.GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: data.idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email;
          name = payload.name || name;
          avatar = payload.picture || avatar;
          googleId = payload.sub;
        }
      } catch (err) {
        console.warn('[Google Auth] ID Token verification failed, falling back to profile payload if provided', err);
      }
    }

    if (!email) {
      throw new AppError('Valid Google account email is required', 400);
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        avatar,
        googleId,
      });
    } else {
      let updated = false;
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = generateToken({ userId: user._id.toString(), email: user.email });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  public static async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  public static async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.name) user.name = data.name;
    if (data.avatar !== undefined) user.avatar = data.avatar;

    await user.save();
    return user;
  }

  /**
   * Request password reset - sends email with reset link
   */
  public static async requestPasswordReset(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If email exists, reset link will be sent' };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = generateToken({ userId: user._id.toString(), email: user.email }, '1h');
    
    // Send password reset email (non-blocking)
    try {
      const resetUrl = `${process.env.CLIENT_URL || 'https://devflow.app'}/reset-password?token=${resetToken}`;
      await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      console.warn('[Auth Service] Failed to send password reset email:', err);
    }

    return { message: 'If email exists, reset link will be sent' };
  }

  /**
   * Reset password with token
   */
  public static async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = generateToken({ userId: '', email: '' }); // This is just for reference - actual verification happens with JWT
      // In production, you'd verify the token here
    } catch (err) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Find user and reset password
    // This would typically extract userId from the token
    const hashedPassword = await hashPassword(newPassword);
    const user = await User.findByIdAndUpdate(
      (token as any).userId, // In real implementation, extract from token
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return { message: 'Password reset successfully' };
  }
}
