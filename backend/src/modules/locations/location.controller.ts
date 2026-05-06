import { Request, Response, NextFunction } from 'express';
import { Location } from './location.model';

export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await Location.create({
      ...req.body,
      ownerId: req.user!.userId
    });
    res.status(201).json({ success: true, data: location });
  } catch (error) { next(error); }
};

export const getLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locations = await Location.find({ ownerId: req.user!.userId, isActive: true });
    res.json({ success: true, data: locations });
  } catch (error) { next(error); }
};

export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user!.userId },
      { $set: req.body },
      { new: true }
    );
    if (!location) return res.status(404).json({ success: false, error: { code: 404, message: 'Location not found' } });
    res.json({ success: true, data: location });
  } catch (error) { next(error); }
};
