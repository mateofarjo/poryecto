import { Router } from 'express';
import { z } from 'zod';
import { listUsers, setUserStatus } from '../services/userService';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware';

const router = Router();

const statusSchema = z.enum(['active', 'inactive']).optional();

router.use(requireAuth, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const statusParam = req.query.status;
    const status = statusParam ? statusSchema.parse(statusParam) : undefined;
    const users = await listUsers(status);
    res.json({ users });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid status filter', details: error.flatten() });
    }

    console.error('[auth-service] List users error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/users/:id/activate', async (req, res) => {
  try {
    const updated = await setUserStatus(req.params.id, 'active');
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: updated });
  } catch (error) {
    if ((error as Error).message === 'INVALID_ID') {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    console.error('[auth-service] Activate user error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const updated = await setUserStatus(req.params.id, 'inactive');
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: updated });
  } catch (error) {
    if ((error as Error).message === 'INVALID_ID') {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    console.error('[auth-service] Deactivate user error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
