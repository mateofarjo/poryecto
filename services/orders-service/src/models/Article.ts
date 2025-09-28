import mongoose, { Schema } from 'mongoose';

export interface ArticleDocument extends mongoose.Document {
  code: string;
  name: string;
  stock: number;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<ArticleDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

articleSchema.index({ code: 1 }, { unique: true });

export const ArticleModel = mongoose.model<ArticleDocument>('Article', articleSchema);
