import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import { getMe, updateMe, deleteMe } from './users.controller';

const router = Router();

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    cafeName: z.string().min(2).optional()
  })
});

const deleteSchema = z.object({
  body: z.object({
    confirm: z.literal('DELETE')
  })
});

router.use(requireAuth);

router.get('/me', getMe);
router.patch('/me', validate(updateSchema), updateMe);
router.delete('/me', validate(deleteSchema), deleteMe);

export default router;
