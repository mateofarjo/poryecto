import { ArticleModel, ArticleDocument } from "../models/Article";
import { Types } from "mongoose";

class ArticleRepository {
  private static instance: ArticleRepository;

  // Exposes a single shared repository to keep model state consistent.
  static getInstance(): ArticleRepository {
    if (!ArticleRepository.instance) {
      ArticleRepository.instance = new ArticleRepository();
    }
    return ArticleRepository.instance;
  }

  async create(article: Pick<ArticleDocument, "code" | "name" | "stock" | "unitPrice">): Promise<ArticleDocument> {
    return ArticleModel.create(article);
  }

  async list(): Promise<ArticleDocument[]> {
    return ArticleModel.find().sort({ code: 1 }).exec();
  }

  async findByCodes(codes: string[]): Promise<ArticleDocument[]> {
    return ArticleModel.find({ code: { $in: codes.map((code) => code.toUpperCase()) } })
      .sort({ code: 1 })
      .exec();
  }

  async findByCode(code: string): Promise<ArticleDocument | null> {
    return ArticleModel.findOne({ code: code.toUpperCase() }).exec();
  }

  async findByIdAndUpdate(articleId: string, payload: Partial<ArticleDocument>): Promise<ArticleDocument | null> {
    if (!Types.ObjectId.isValid(articleId)) {
      throw new Error("INVALID_ID");
    }

    return ArticleModel.findByIdAndUpdate(articleId, { $set: payload }, { new: true, runValidators: true }).exec();
  }

  async atomicUpdateStock(code: string, quantity: number, session: any): Promise<ArticleDocument | null> {
    return ArticleModel.findOneAndUpdate(
      {
        code: code.toUpperCase(),
        stock: { $gte: quantity },
      },
      { $inc: { stock: -quantity } },
      { session, new: true }
    );
  }
}

export const articleRepository = ArticleRepository.getInstance();
