import { Request } from 'express';
import mongoose from 'mongoose';

export const buildLocationFilter = (req: Request) => {
  const user = req.user!;
  
  // For Owners, they own the items. They can optionally filter by a specific location.
  if (user.role === 'owner') {
    const filter: any = { userId: new mongoose.Types.ObjectId(user.userId) };
    if (req.query.locationId) {
      filter.locationId = new mongoose.Types.ObjectId(req.query.locationId as string);
    }
    return filter;
  }

  // For Managers and Staff, they do not own the items, their boss (ownerId) does.
  // And they are strictly restricted to their assigned locationId.
  return {
    userId: new mongoose.Types.ObjectId(user.ownerId!),
    locationId: new mongoose.Types.ObjectId(user.locationId!)
  };
};
