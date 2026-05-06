import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import * as Controller from './wasteLog.controller';

const router = Router();

const createSchema = z.object({
  body: z.object({
    inventoryItemId: z.string(),
    quantity: z.number().positive(),
    reason: z.enum(['overproduction', 'spoilage', 'expired', 'damaged', 'customer_return', 'other']),
    notes: z.string().optional(),
    locationId: z.string().optional()
  })
});

router.use(requireAuth);

router.post('/', validate(createSchema), Controller.logWaste);
router.get('/', Controller.getLogs);
router.get('/summary', Controller.getSummary);
router.get('/export', Controller.exportLogs);

export default router;
