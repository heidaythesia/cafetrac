import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

export const generateAccessToken = (userId: string, role: string, locationId?: string, ownerId?: string) => {
  return jwt.sign(
    { userId, role, locationId, ownerId },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
};

export const generateRefreshToken = (userId: string) => {
  const token = crypto.randomBytes(40).toString('hex');
  return `${userId}.${token}`; // Append userId to avoid searching all documents
};
