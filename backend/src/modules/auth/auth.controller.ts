import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from './user.model';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { env } from '../../config/env';
import { safeCompare } from '../../utils/tokenCompare';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../../services/email.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, cafeName } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'Email already in use' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, cafeName, role: 'owner' });

    res.status(201).json({ success: true, data: { userId: user._id, message: 'Registered successfully' } });
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid credentials' } });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid credentials' } });

    const accessToken = generateAccessToken(user._id.toString(), user.role, user.locationId?.toString(), user.ownerId?.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    
    const rtHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokens.push(rtHash);
    await user.save();

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken, user: { id: user._id, name: user.name, role: user.role } } });
  } catch (error) { next(error); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ success: false, error: { code: 401, message: 'No refresh token' } });

    const userId = refreshToken.split('.')[0];
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ success: false, error: { code: 401, message: 'Invalid refresh token' } });

    // Find the token (hashed)
    let tokenIndex = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      if (await bcrypt.compare(refreshToken, user.refreshTokens[i])) {
        tokenIndex = i;
        break;
      }
    }

    // Reuse detection
    if (tokenIndex === -1) {
      // Token not found in DB but provided -> REUSE detected! Revoke all.
      user.refreshTokens = [];
      await user.save();
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return res.status(401).json({ success: false, error: { code: 401, message: 'Token reuse detected. All sessions revoked.' } });
    }

    // Rotate token
    user.refreshTokens.splice(tokenIndex, 1);
    const newRefreshToken = generateRefreshToken(user._id.toString());
    const rtHash = await bcrypt.hash(newRefreshToken, 10);
    user.refreshTokens.push(rtHash);
    await user.save();

    const accessToken = generateAccessToken(user._id.toString(), user.role, user.locationId?.toString(), user.ownerId?.toString());
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken } });
  } catch (error) { next(error); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    
    if (refreshToken) {
      const userId = refreshToken.split('.')[0];
      const user = await User.findById(userId);
      if (user) {
        let validHashes = [];
        for (const hash of user.refreshTokens) {
          const isMatch = await bcrypt.compare(refreshToken, hash);
          if (!isMatch) validHashes.push(hash);
        }
        user.refreshTokens = validHashes;
        await user.save();
      }
    }
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (error) { next(error); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      const clientUrl = env.CORS_ORIGINS.split(',')[0].trim();
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    }

    // Always return the same response to prevent email enumeration
    res.json({ success: true, data: { message: 'If an account exists, a reset link has been sent.' } });
  } catch (error) { next(error); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'Invalid or expired reset token' } });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.refreshTokens = []; // revoke existing sessions after password reset
    await user.save();

    res.json({ success: true, data: { message: 'Password has been reset successfully' } });
  } catch (error) { next(error); }
};
