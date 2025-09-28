import mongoose, { Schema } from 'mongoose';

export type UserStatus = 'inactive' | 'active';
export type UserRole = 'user' | 'admin';

export interface UserDocument extends mongoose.Document {
  name: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
