import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../auth/user.model';
import crypto from 'crypto';

export const inviteTeamMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role, locationId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'User already exists' } });
    }

    // In a real flow, we'd send an email with a setup token.
    // Here we auto-generate a generic password for simplicity in the SaaS flow.
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const owner = await User.findById(req.user!.userId);
    if (!owner) throw new Error('Owner not found');

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role,
      cafeName: owner.cafeName, // Inherit cafe name from owner
      ownerId: req.user!.userId,
      locationId: locationId || undefined
    });

    // NOTE: Console log the temp password since email isn't configured yet
    console.log(`[TEAM INVITE] User ${email} created. Temp password: ${tempPassword}`);

    res.status(201).json({ success: true, data: { userId: newUser._id, tempPassword, message: 'Team member invited' } });
  } catch (error) { next(error); }
};

export const getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await User.find({ ownerId: req.user!.userId }).select('-passwordHash -refreshTokens');
    res.json({ success: true, data: team });
  } catch (error) { next(error); }
};

export const removeTeamMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await User.findOneAndDelete({ _id: req.params.id, ownerId: req.user!.userId });
    if (!member) return res.status(404).json({ success: false, error: { code: 404, message: 'Member not found' } });
    res.json({ success: true, data: { message: 'Member removed' } });
  } catch (error) { next(error); }
};
