import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import * as Controller from './inventory.controller';
import { getSupplierForItem } from './inventory.supplier.controller';

const router = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    category: z.enum(['Beverages', 'Food', 'Packaging', 'Cleaning', 'Other']),
    unit: z.string().min(1),
    costPerUnit: z.number().min(0),
    currentStock: z.number().min(0).default(0),
    parLevel: z.number().min(0).default(0),
    reorderQuantity: z.number().min(0).default(0),
    locationId: z.string().optional()
  })
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    category: z.enum(['Beverages', 'Food', 'Packaging', 'Cleaning', 'Other']).optional(),
    unit: z.string().min(1).optional(),
    costPerUnit: z.number().min(0).optional(),
    currentStock: z.number().min(0).optional(),
    parLevel: z.number().min(0).optional(),
    reorderQuantity: z.number().min(0).optional(),
    locationId: z.string().optional()
  })
});

const stockSchema = z.object({
  body: z.object({
    quantity: z.number().positive(),
    reason: z.string().optional()
  }),
  params: z.object({ id: z.string() })
});

const alertThresholdSchema = z.object({
  body: z.object({
    alertThreshold: z.number().min(0)
  })
});

router.use(requireAuth);

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', Controller.getItems);

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create new inventory item
 *     tags: [Inventory]
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', validate(createSchema), Controller.createItem);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Get items with stock below par level
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/low-stock', Controller.getLowStock);

router.get('/:id/supplier', getSupplierForItem);

router.put('/:id', validate(updateSchema), Controller.updateItem);
router.delete('/:id', Controller.deleteItem);

router.post('/:id/stock-in', validate(stockSchema), Controller.stockIn);
router.post('/:id/stock-out', validate(stockSchema), Controller.stockOut);
router.patch('/:id/alert-threshold', validate(alertThresholdSchema), Controller.setAlertThreshold);

export default router;
