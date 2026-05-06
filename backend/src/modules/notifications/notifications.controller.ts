import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PushSubscription } from './pushSubscription.model';
import { Notification } from './notification.model';

export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const { endpoint, keys, deviceName } = req.body;

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId, endpoint, keys, deviceName },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { message: 'Subscribed to push notifications' } });
  } catch (error) { next(error); }
};

export const unsubscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.findOneAndDelete({ endpoint });
    res.json({ success: true, data: { message: 'Unsubscribed from push notifications' } });
  } catch (error) { next(error); }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    const filter: any = { userId };
    if (unreadOnly === 'true') filter.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (error) { next(error); }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (error) { next(error); }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
};
