import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: 'low_stock' | 'waste_spike' | 'po_sent' | 'po_received' | 'daily_digest' | 'general';
  link: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['low_stock', 'waste_spike', 'po_sent', 'po_received', 'daily_digest', 'general'], required: true },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
