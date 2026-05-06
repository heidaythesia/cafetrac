import { Router } from 'express';
import { createLocation, getLocations, updateLocation } from './location.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const locationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    address: z.string().min(1)
  })
});

router.use(requireAuth);
router.use(roleGuard(['owner']));

router.post('/', validate(locationSchema), createLocation);
router.get('/', getLocations);
router.patch('/:id', validate(locationSchema.partial()), updateLocation);

export default router;
