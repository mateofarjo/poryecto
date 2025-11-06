import mongoose from "mongoose";
import { OrderModel, OrderDocument } from "../models/Order";

class OrderRepository {
  private static instance: OrderRepository;

  // Singleton keeps counters and sessions aligned across requests.
  static getInstance(): OrderRepository {
    if (!OrderRepository.instance) {
      OrderRepository.instance = new OrderRepository();
    }
    return OrderRepository.instance;
  }

  async create(order: Omit<OrderDocument, keyof mongoose.Document>): Promise<OrderDocument> {
    const created = await OrderModel.create(order);
    return created;
  }

  async createWithinSession(order: Record<string, unknown>, session: mongoose.ClientSession): Promise<OrderDocument> {
    const docs = await OrderModel.create([order], { session });
    return docs[0];
  }

  async list(): Promise<OrderDocument[]> {
    return OrderModel.find().sort({ createdAt: -1 }).exec();
  }

  async listByUserEmail(email: string): Promise<OrderDocument[]> {
    return OrderModel.find({ userEmail: email }).sort({ createdAt: -1 }).exec();
  }

  async aggregateUserArticleStats(
    userEmail: string,
    limit = 5
  ): Promise<Array<{ code: string; totalQuantity: number; lastOrderDate: Date }>> {
    const aggregation = await OrderModel.aggregate<{
      _id: string;
      totalQuantity: number;
      lastOrderDate: Date;
    }>([
      { $match: { userEmail } },
      {
        $group: {
          _id: "$articleCode",
          totalQuantity: { $sum: "$quantity" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]).exec();

    return aggregation.map((item) => ({
      code: item._id,
      totalQuantity: item.totalQuantity,
      lastOrderDate: item.lastOrderDate,
    }));
  }

  async aggregateGlobalTopArticles(limit = 5): Promise<Array<{ code: string; totalQuantity: number }>> {
    const aggregation = await OrderModel.aggregate<{
      _id: string;
      totalQuantity: number;
    }>([
      { $group: { _id: "$articleCode", totalQuantity: { $sum: "$quantity" } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
    ]).exec();

    return aggregation.map((item) => ({
      code: item._id,
      totalQuantity: item.totalQuantity,
    }));
  }
}

export const orderRepository = OrderRepository.getInstance();
