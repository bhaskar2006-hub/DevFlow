import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';

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
}
