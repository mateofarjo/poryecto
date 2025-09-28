import { Router } from 'express';
import { z } from 'zod';
import { createArticle, listArticles, updateArticle } from '../services/articleService';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware';

const router = Router();

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(2),
  stock: z.number().int().nonnegative(),
  unitPrice: z.number().nonnegative()
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  stock: z.number().int().nonnegative().optional(),
  unitPrice: z.number().nonnegative().optional()
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payload = createSchema.parse(req.body);
    const article = await createArticle(payload);
    res.status(201).json({ article });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', details: error.flatten() });
    }

    if ((error as Error).message === 'ARTICLE_EXISTS') {
      return res.status(409).json({ message: 'Article code already exists' });
    }

    console.error('[orders-service] Create article error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (_req, res) => {
  try {
    const articles = await listArticles();
    res.json({ articles });
  } catch (error) {
    console.error('[orders-service] List articles error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const payload = updateSchema.parse(req.body);
    const updated = await updateArticle(req.params.id, payload);
    if (!updated) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json({ article: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', details: error.flatten() });
    }

    if ((error as Error).message === 'INVALID_ID') {
      return res.status(400).json({ message: 'Invalid article id' });
    }

    console.error('[orders-service] Update article error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
