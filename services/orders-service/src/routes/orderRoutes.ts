import { Router } from 'express';
import { z } from 'zod';
import { createOrder, listOrders } from '../services/orderService';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OrderModel } from '../models/Order';

const router = Router();

const createSchema = z.object({
  customerName: z.string().min(2),
  articleCode: z.string().min(1),
  quantity: z.number().int().positive()
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = createSchema.parse(req.body);
    const order = await createOrder({
      customerName: payload.customerName,
      articleCode: payload.articleCode,
      quantity: payload.quantity,
      userEmail: req.user!.email,
      userName: req.user!.name
    });
    res.status(201).json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', details: error.flatten() });
    }

    if ((error as Error).message === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({ message: 'Insufficient stock' });
    }

    console.error('[orders-service] Create order error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const principal = req.user!;
    let orders;
    if (principal.role === 'admin') {
      // Admins see all orders across customers.
      orders = await listOrders();
    } else {
      orders = await OrderModel.find({ userEmail: principal.email }).sort({ createdAt: -1 }).exec();
    }
    res.json({ orders });
  } catch (error) {
    console.error('[orders-service] List orders error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
