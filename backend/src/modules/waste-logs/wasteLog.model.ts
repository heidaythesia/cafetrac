import mongoose, { Schema, Document } from 'mongoose';

export interface IWasteLog extends Document {
  inventoryItemId: mongoose.Types.ObjectId;
  itemName: string;
  quantity: number;
  unit: string;
  reason: 'overproduction' | 'spoilage' | 'expired' | 'damaged' | 'customer_return' | 'other';
  costAtTimeOfLogging: number;
  totalCost: number;
  staffId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  notes?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WasteLogSchema = new Schema<IWasteLog>({
  inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  reason: { type: String, enum: ['overproduction', 'spoilage', 'expired', 'damaged', 'customer_return', 'other'], required: true },
  costAtTimeOfLogging: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  notes: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

export const WasteLog = mongoose.model<IWasteLog>('WasteLog', WasteLogSchema);
