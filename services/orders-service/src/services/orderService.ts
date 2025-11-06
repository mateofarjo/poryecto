import mongoose from "mongoose";
import { OrderDocument } from "../models/Order";
import { getNextOrderNumber } from "../utils/orderNumber";
import { articleRepository } from "../repositories/ArticleRepository";
import { orderRepository } from "../repositories/OrderRepository";

interface OrderInput {
  userName: string;
  userEmail: string;
  customerName: string;
  articleCode: string;
  quantity: number;
}

export async function createOrder(input: OrderInput): Promise<OrderDocument> {
  const session = await mongoose.startSession();

  try {
    let createdOrder: OrderDocument | null = null;
    // Reserve stock and create the order atomically to prevent overselling.
    await session.withTransaction(async () => {
      const article = await articleRepository.atomicUpdateStock(input.articleCode, input.quantity, session);

      if (!article) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const orderNumber = await getNextOrderNumber();
      const totalAmount = article.unitPrice * input.quantity;

      createdOrder = await orderRepository.createWithinSession(
        {
          orderNumber,
          userName: input.userName,
          userEmail: input.userEmail,
          customerName: input.customerName,
          articleCode: article.code,
          quantity: input.quantity,
          unitPrice: article.unitPrice,
          totalAmount,
        },
        session
      );
    });

    if (!createdOrder) {
      throw new Error("ORDER_CREATION_FAILED");
    }

    return createdOrder;
  } finally {
    await session.endSession();
  }
}

export async function listOrders(): Promise<OrderDocument[]> {
  return orderRepository.list();
}
