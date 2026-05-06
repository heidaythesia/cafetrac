import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import * as Controller from './purchaseOrder.controller';

const router = Router();

const createSchema = z.object({
  body: z.object({
    supplierId: z.string(),
    items: z.array(z.object({
      inventoryItemId: z.string(),
      quantityOrdered: z.number().positive()
    })).min(1),
    notes: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    locationId: z.string().optional()
  })
});

const updateSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
    expectedDeliveryDate: z.string().optional()
  })
});

router.use(requireAuth);

router.post('/from-low-stock', Controller.autoDraftFromLowStock);

router.get('/', Controller.getPOs);
router.post('/', validate(createSchema), Controller.createPO);
router.get('/supplier/:supplierId', Controller.getPOsForSupplier);
router.get('/:id', Controller.getPO);
router.patch('/:id', validate(updateSchema), Controller.updatePO);
router.delete('/:id', Controller.deletePO);

router.post('/:id/send', Controller.sendPO);
router.post('/:id/receive', Controller.receivePO);

export default router;
