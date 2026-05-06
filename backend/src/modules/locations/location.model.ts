import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  address: string;
  ownerId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const LocationSchema = new Schema<ILocation>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
