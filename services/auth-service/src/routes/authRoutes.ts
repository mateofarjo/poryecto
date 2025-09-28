import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser, registerUser } from '../services/userService';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    await registerUser({ name, email, password });
    res.status(201).json({ message: 'User registered. Await activation by an administrator.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', details: error.flatten() });
    }

    if ((error as Error).message.includes('duplicate key')) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    console.error('[auth-service] Register error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authenticateUser(email, password);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', details: error.flatten() });
    }

    if ((error as Error).message === 'USER_INACTIVE') {
      return res.status(403).json({ message: 'User account inactive' });
    }

    if ((error as Error).message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.error('[auth-service] Login error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

export default router;
