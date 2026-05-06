import { Request, Response, NextFunction } from 'express';
import { format } from '@fast-csv/format';
import { WasteLog } from './wasteLog.model';
import { InventoryItem } from '../inventory/inventory.model';
import { assertOwnership } from '../../utils/ownershipCheck';
import { buildLocationFilter } from '../../utils/locationFilter';

export const logWaste = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const ownerId = user.role === 'owner' ? user.userId : user.ownerId;
    const { inventoryItemId, quantity, reason, notes } = req.body;

    // 1. Fetch inventory item
    const filter = buildLocationFilter(req);
    const item = await InventoryItem.findOne({ _id: inventoryItemId, ...filter });
    if (!item || item.isArchived) return res.status(404).json({ success: false, error: { code: 404, message: 'Item not found' } });

    // 2. Snapshot cost
    const costAtTimeOfLogging = quantity * item.costPerUnit;

    // 3. Update stock-out logic
    item.currentStock -= quantity;
    if (item.currentStock < 0) item.currentStock = 0;
    await item.save();

    // 4. Create log
    const log = await WasteLog.create({
      inventoryItemId: item._id,
      itemName: item.name,
      quantity,
      unit: item.unit,
      reason,
      costAtTimeOfLogging,
      totalCost: costAtTimeOfLogging,
      staffId: user.userId,
      locationId: item.locationId,
      notes,
      userId: ownerId
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) { next(error); }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const logs = await WasteLog.find({ ...filter }).sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { startDate, endDate } = req.query;

    const query: any = { ...filter };
    if (startDate && endDate) {
      query.createdAt = { 
        $gte: new Date(startDate as string), 
        $lte: new Date(endDate as string) 
      };
    }

    const logs = await WasteLog.find(query);

    let totalCost = 0;
    const breakdown: Record<string, number> = {};
    const itemTotals: Record<string, number> = {};

    logs.forEach(log => {
      totalCost += log.costAtTimeOfLogging;
      breakdown[log.reason] = (breakdown[log.reason] || 0) + log.costAtTimeOfLogging;
      itemTotals[log.itemName] = (itemTotals[log.itemName] || 0) + log.costAtTimeOfLogging;
    });

    const topItems = Object.entries(itemTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, cost]) => ({ name, cost }));

    res.json({ 
      success: true, 
      data: { totalCost, breakdown, topItems } 
    });
  } catch (error) { next(error); }
};

export const exportLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const logs = await WasteLog.find({ ...filter }).sort({ createdAt: -1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=waste_logs.csv');

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    logs.forEach(log => {
      csvStream.write({
        Date: (log.createdAt as any).toISOString(),
        Item: log.itemName,
        Quantity: log.quantity,
        Unit: log.unit,
        Reason: log.reason,
        'Cost Loss': log.costAtTimeOfLogging,
        Notes: log.notes || ''
      });
    });

    csvStream.end();
  } catch (error) { next(error); }
};
