import mongoose from "mongoose";
import { OrderModel, OrderDocument } from "../models/Order";

class OrderRepository {
  private static instance: OrderRepository;

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
}

export const orderRepository = OrderRepository.getInstance();
