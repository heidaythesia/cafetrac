import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/requireAuth';
import * as Controller from './supplier.controller';

const router = Router();

const schema = z.object({
  body: z.object({
    name: z.string().min(1),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional()
  })
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional()
  })
});

router.use(requireAuth);

router.get('/', Controller.getSuppliers);
router.post('/', validate(schema), Controller.createSupplier);
router.get('/:id', Controller.getSupplier);
router.patch('/:id', validate(updateSchema), Controller.updateSupplier);
router.delete('/:id', Controller.deleteSupplier);

export default router;
