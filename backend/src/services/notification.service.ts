import webpush from 'web-push';
import mongoose from 'mongoose';
import { PushSubscription } from '../modules/notifications/pushSubscription.model';
import { Notification } from '../modules/notifications/notification.model';
import { env } from '../config/env';

webpush.setVapidDetails(
  env.VAPID_EMAIL,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

export const sendPushNotification = async (
  userId: string,
  payload: { title: string; body: string; type: 'low_stock' | 'waste_spike' | 'po_sent' | 'po_received' | 'daily_digest' | 'general'; link: string }
) => {
  try {
    // Save to DB
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: payload.title,
      body: payload.body,
      type: payload.type,
      link: payload.link
    });

    // Find all subscriptions for user
    const subscriptions = await PushSubscription.find({ userId: new mongoose.Types.ObjectId(userId) });
    
    // Send push to each subscription
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      link: payload.link,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png'
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: sub.keys
        }, pushPayload);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or unsubscribed
          await PushSubscription.findByIdAndDelete(sub._id);
        } else {
          console.error('[WebPush Error]', error);
        }
      }
    });

    await Promise.all(sendPromises);
    return notification;
  } catch (error) {
    console.error('[Notification Service Error]', error);
    // Don't throw, we want this to be fire-and-forget
  }
};
