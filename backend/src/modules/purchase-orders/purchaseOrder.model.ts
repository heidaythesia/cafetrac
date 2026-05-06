import mongoose, { Schema, Document } from 'mongoose';

export interface IPOItem {
  inventoryItemId: mongoose.Types.ObjectId;
  itemName: string;
  quantityOrdered: number;
  unit: string;
  estimatedUnitCost: number;
  totalCost: number;
}

export interface IPurchaseOrder extends Document {
  orderNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  supplierEmail?: string;
  items: IPOItem[];
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  totalEstimatedCost: number;
  notes?: string;
  expectedDeliveryDate?: Date;
  sentAt?: Date;
  receivedAt?: Date;
  userId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  orderNumber: { type: String, required: true, unique: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName: { type: String, required: true },
  supplierEmail: { type: String },
  items: [{
    inventoryItemId: { type: Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    itemName: { type: String, required: true },
    quantityOrdered: { type: Number, required: true },
    unit: { type: String, required: true },
    estimatedUnitCost: { type: Number, required: true },
    totalCost: { type: Number, required: true }
  }],
  status: { type: String, enum: ['draft', 'sent', 'received', 'cancelled'], default: 'draft' },
  totalEstimatedCost: { type: Number, required: true },
  notes: { type: String },
  expectedDeliveryDate: { type: Date },
  sentAt: { type: Date },
  receivedAt: { type: Date },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true }
}, { timestamps: true });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
