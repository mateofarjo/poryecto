import mongoose, { Schema } from 'mongoose';

export interface CounterDocument extends mongoose.Document {
  key: string;
  value: number;
}

const counterSchema = new Schema<CounterDocument>({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 }
});

export const CounterModel = mongoose.model<CounterDocument>('Counter', counterSchema);
