import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'manager' | 'staff';
  cafeName: string;
  refreshTokens: string[];
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  locationId?: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['owner', 'manager', 'staff'], default: 'owner' },
  cafeName: { type: String, required: true },
  refreshTokens: [{ type: String }],
  passwordResetTokenHash: { type: String },
  passwordResetExpiresAt: { type: Date },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
