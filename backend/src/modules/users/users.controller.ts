import { Request, Response, NextFunction } from 'express';
import { User } from '../auth/user.model';
import { assertOwnership } from '../../utils/ownershipCheck';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId).select('-passwordHash -refreshTokens');
    if (!user) {
      assertOwnership(undefined, userId); // Will throw 404
    }
    assertOwnership(user!._id.toString(), userId);
    
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, cafeName } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      assertOwnership(undefined, userId);
      return;
    }
    assertOwnership(user._id.toString(), userId);

    if (name) user.name = name;
    if (cafeName) user.cafeName = cafeName;
    await user.save();

    res.json({ success: true, data: { name: user.name, cafeName: user.cafeName } });
  } catch (error) { next(error); }
};

export const deleteMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { confirm } = req.body;

    if (confirm !== 'DELETE') {
      return res.status(400).json({ success: false, error: { code: 400, message: "Requires { confirm: 'DELETE' }" } });
    }

    const user = await User.findById(userId);
    if (!user) {
      assertOwnership(undefined, userId);
      return;
    }
    assertOwnership(user._id.toString(), userId);

    await user.deleteOne();
    res.clearCookie('refreshToken');
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (error) { next(error); }
};
