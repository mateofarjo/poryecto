import mongoose, { Schema } from 'mongoose';

export interface OrderDocument extends mongoose.Document {
  orderNumber: string;
  date: Date;
  userName: string;
  userEmail: string;
  customerName: string;
  articleCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    customerName: { type: String, required: true },
    articleCode: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ articleCode: 1 });

export const OrderModel = mongoose.model<OrderDocument>('Order', orderSchema);
