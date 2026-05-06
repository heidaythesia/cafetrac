import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledReport extends Document {
  reportType: 'waste' | 'inventory' | 'summary';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  userId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  isActive: boolean;
  lastRunAt?: Date;
}

const ScheduledReportSchema = new Schema<IScheduledReport>({
  reportType: { type: String, enum: ['waste', 'inventory', 'summary'], required: true },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  recipients: [{ type: String, required: true }],
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  isActive: { type: Boolean, default: true },
  lastRunAt: { type: Date }
}, { timestamps: true });

export const ScheduledReport = mongoose.model<IScheduledReport>('ScheduledReport', ScheduledReportSchema);
