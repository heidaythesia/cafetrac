import { Request, Response, NextFunction } from 'express';
import { PurchaseOrder } from './purchaseOrder.model';
import { Supplier } from '../suppliers/supplier.model';
import { InventoryItem } from '../inventory/inventory.model';
import { assertOwnership } from '../../utils/ownershipCheck';
import { sendPurchaseOrderEmail } from '../../services/email.service';
import { buildLocationFilter } from '../../utils/locationFilter';

const generateOrderNumber = async (userId: string) => {
  const count = await PurchaseOrder.countDocuments({ userId });
  return `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
};

export const createPO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const ownerId = user.role === 'owner' ? user.userId : user.ownerId;
    const { supplierId, items, notes, expectedDeliveryDate } = req.body;
    const locationId = user.role === 'owner' ? req.body.locationId : user.locationId;

    if (!locationId) return res.status(400).json({ success: false, error: { message: 'locationId is required' } });

    const supplier = await Supplier.findOne({ _id: supplierId, userId: ownerId });
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });

    let totalEstimatedCost = 0;
    const poItems = [];

    const filter = buildLocationFilter(req);

    for (const item of items) {
      const invItem = await InventoryItem.findOne({ _id: item.inventoryItemId, ...filter });
      if (!invItem) continue;

      const itemCost = item.quantityOrdered * invItem.costPerUnit;
      totalEstimatedCost += itemCost;
      poItems.push({
        inventoryItemId: invItem._id,
        itemName: invItem.name,
        quantityOrdered: item.quantityOrdered,
        unit: invItem.unit,
        estimatedUnitCost: invItem.costPerUnit,
        totalCost: itemCost
      });
    }

    const orderNumber = await generateOrderNumber(ownerId as string);

    const po = await PurchaseOrder.create({
      orderNumber,
      supplierId,
      supplierName: supplier.name,
      supplierEmail: supplier.email,
      items: poItems,
      totalEstimatedCost,
      notes,
      expectedDeliveryDate,
      userId: ownerId,
      locationId
    });

    res.status(201).json({ success: true, data: po });
  } catch (error) { next(error); }
};

export const getPOs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const pos = await PurchaseOrder.find({ ...filter, status: { $ne: 'cancelled' } }).sort({ createdAt: -1 });
    res.json({ success: true, data: pos });
  } catch (error) { next(error); }
};

export const getPO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...filter });
    if (!po) return res.status(404).json({ success: false, error: { code: 404, message: 'PO not found' } });
    res.json({ success: true, data: po });
  } catch (error) { next(error); }
};

export const updatePO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...filter });
    if (!po) return res.status(404).json({ success: false, error: { code: 404, message: 'PO not found' } });

    if (po.status !== 'draft') {
      return res.status(400).json({ success: false, error: { message: 'Only draft POs can be updated' } });
    }

    Object.assign(po, req.body);
    await po.save();
    res.json({ success: true, data: po });
  } catch (error) { next(error); }
};

export const deletePO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...filter });
    if (!po) return res.status(404).json({ success: false, error: { code: 404, message: 'PO not found' } });

    po.status = 'cancelled';
    await po.save();
    res.json({ success: true, data: { message: 'PO cancelled' } });
  } catch (error) { next(error); }
};

export const sendPO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...filter });
    if (!po) return res.status(404).json({ success: false, error: { code: 404, message: 'PO not found' } });

    if (po.status !== 'draft') {
      return res.status(400).json({ success: false, error: { message: 'Only draft POs can be sent' } });
    }

    if (po.supplierEmail) {
      await sendPurchaseOrderEmail(po.supplierEmail, po.supplierName, po);
    }

    po.status = 'sent';
    po.sentAt = new Date();
    await po.save();

    res.json({ success: true, data: po });
  } catch (error) { next(error); }
};

export const receivePO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...filter });
    if (!po) return res.status(404).json({ success: false, error: { code: 404, message: 'PO not found' } });

    if (po.status !== 'sent') {
      return res.status(400).json({ success: false, error: { message: 'Only sent POs can be received' } });
    }

    // Process Stock In automatically
    for (const item of po.items) {
      const invItem = await InventoryItem.findById(item.inventoryItemId);
      if (invItem) {
        invItem.currentStock += item.quantityOrdered;
        await invItem.save();
      }
    }

    po.status = 'received';
    po.receivedAt = new Date();
    await po.save();

    res.json({ success: true, data: po });
  } catch (error) { next(error); }
};

export const autoDraftFromLowStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const ownerId = user.role === 'owner' ? user.userId : user.ownerId;
    const filter = buildLocationFilter(req);

    const lowStockItems = await InventoryItem.find({ 
      ...filter, 
      isArchived: false,
      $expr: { $lte: ['$currentStock', '$parLevel'] }
    });

    const itemsBySupplierAndLocation: Record<string, any[]> = {};

    lowStockItems.forEach(item => {
      const supId = item.supplierId ? item.supplierId.toString() : 'unassigned';
      const locId = item.locationId.toString();
      const key = `${supId}_${locId}`;
      if (!itemsBySupplierAndLocation[key]) itemsBySupplierAndLocation[key] = [];
      itemsBySupplierAndLocation[key].push(item);
    });

    const createdPOs = [];

    for (const [key, items] of Object.entries(itemsBySupplierAndLocation)) {
      const [supId, locId] = key.split('_');
      if (supId === 'unassigned') continue; // Only auto-draft for items with suppliers

      const supplier = await Supplier.findById(supId);
      if (!supplier) continue;

      let totalCost = 0;
      const poItems = items.map(item => {
        const qty = item.reorderQuantity > 0 ? item.reorderQuantity : item.parLevel * 2 || 10;
        const cost = qty * item.costPerUnit;
        totalCost += cost;
        return {
          inventoryItemId: item._id,
          itemName: item.name,
          quantityOrdered: qty,
          unit: item.unit,
          estimatedUnitCost: item.costPerUnit,
          totalCost: cost
        };
      });

      const orderNumber = await generateOrderNumber(ownerId as string);
      
      const po = await PurchaseOrder.create({
        orderNumber,
        supplierId: supplier._id,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
        items: poItems,
        totalEstimatedCost: totalCost,
        userId: ownerId,
        locationId: locId
      });

      createdPOs.push(po);
    }

    res.status(201).json({ success: true, data: createdPOs });
  } catch (error) { next(error); }
};

export const getPOsForSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const pos = await PurchaseOrder.find({ ...filter, supplierId: req.params.supplierId, status: { $ne: 'cancelled' } });
    res.json({ success: true, data: pos });
  } catch (error) { next(error); }
};
