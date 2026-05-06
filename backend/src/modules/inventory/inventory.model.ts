import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  name: string;
  category: 'Beverages' | 'Food' | 'Packaging' | 'Cleaning' | 'Other';
  unit: string;
  costPerUnit: number;
  currentStock: number;
  parLevel: number;
  reorderQuantity: number;
  alertThreshold?: number;
  locationId: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  userId: mongoose.Types.ObjectId;
  isArchived: boolean;
}

const InventorySchema = new Schema<IInventoryItem>({
  name: { type: String, required: true },
  category: { type: String, enum: ['Beverages', 'Food', 'Packaging', 'Cleaning', 'Other'], required: true },
  unit: { type: String, required: true },
  costPerUnit: { type: Number, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  parLevel: { type: Number, required: true, default: 0 },
  reorderQuantity: { type: Number, required: true, default: 0 },
  alertThreshold: { type: Number },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventorySchema);
