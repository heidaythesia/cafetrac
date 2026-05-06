import mongoose, { Schema, Document } from 'mongoose';

export interface IWasteAlert extends Document {
  inventoryItemId: mongoose.Types.ObjectId;
  itemName: string;
  thresholdQuantity: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
  alertMethod: 'email' | 'push' | 'both';
  userId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const WasteAlertSchema = new Schema<IWasteAlert>({
  inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  itemName: { type: String, required: true },
  thresholdQuantity: { type: Number, required: true },
  timeframe: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  alertMethod: { type: String, enum: ['email', 'push', 'both'], default: 'push' },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const WasteAlert = mongoose.model<IWasteAlert>('WasteAlert', WasteAlertSchema);
