import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  isActive: boolean;
  userId: mongoose.Types.ObjectId;
}

const SupplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
}, { timestamps: true });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
