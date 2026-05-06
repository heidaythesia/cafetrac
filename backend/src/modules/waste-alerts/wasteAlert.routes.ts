import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import { getAlerts, createAlert, updateAlert, deleteAlert } from './wasteAlert.controller';

const router = Router();

const alertSchema = z.object({
  body: z.object({
    inventoryItemId: z.string().min(1, 'inventoryItemId is required'),
    thresholdQuantity: z.number().min(1, 'thresholdQuantity must be > 0'),
    timeframe: z.enum(['daily', 'weekly', 'monthly']).optional(),
    alertMethod: z.enum(['email', 'push', 'both']).optional(),
  })
});

const updateSchema = z.object({
  body: z.object({
    thresholdQuantity: z.number().min(1).optional(),
    timeframe: z.enum(['daily', 'weekly', 'monthly']).optional(),
    alertMethod: z.enum(['email', 'push', 'both']).optional(),
    isActive: z.boolean().optional()
  })
});

// Alerts are configured by Managers and Owners
router.use(requireAuth);
router.use(roleGuard(['owner', 'manager']));

router.get('/', getAlerts);
router.post('/', validate(alertSchema), createAlert);
router.patch('/:id', validate(updateSchema), updateAlert);
router.delete('/:id', deleteAlert);

export default router;
