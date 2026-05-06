import { Request, Response, NextFunction } from 'express';
import { InventoryItem } from './inventory.model';
import { assertOwnership } from '../../utils/ownershipCheck';
import { Supplier } from '../suppliers/supplier.model';

export const getSupplierForItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const item = await InventoryItem.findById(id);
    if (!item || item.isArchived) return assertOwnership(undefined, userId);
    assertOwnership(item.userId.toString(), userId);

    if (!item.supplierId) {
      return res.json({ success: true, data: null });
    }

    const supplier = await Supplier.findById(item.supplierId);
    if (!supplier) {
      // Return snapshot info if supplier was deleted
      return res.json({ success: true, data: { _id: null, name: item.supplierName, isDeleted: true } });
    }

    assertOwnership(supplier.userId.toString(), userId);
    res.json({ success: true, data: supplier });
  } catch (error) { next(error); }
};
