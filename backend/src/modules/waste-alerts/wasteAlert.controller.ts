import { Request, Response, NextFunction } from 'express';
import { WasteAlert } from './wasteAlert.model';
import { InventoryItem } from '../inventory/inventory.model';
import { buildLocationFilter } from '../../utils/locationFilter';

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const alerts = await WasteAlert.find({ ...filter }).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (error) { next(error); }
};

export const createAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const ownerId = user.role === 'owner' ? user.userId : user.ownerId;
    const { inventoryItemId, thresholdQuantity, timeframe, alertMethod } = req.body;

    const filter = buildLocationFilter(req);
    const item = await InventoryItem.findOne({ _id: inventoryItemId, ...filter });

    if (!item) {
      return res.status(404).json({ success: false, error: { message: 'Inventory item not found or unauthorized' } });
    }

    const alert = await WasteAlert.create({
      inventoryItemId,
      itemName: item.name,
      thresholdQuantity,
      timeframe,
      alertMethod,
      userId: ownerId,
      locationId: item.locationId
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) { next(error); }
};

export const updateAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const alert = await WasteAlert.findOne({ _id: req.params.id, ...filter });
    if (!alert) return res.status(404).json({ success: false, error: { message: 'Alert not found' } });

    Object.assign(alert, req.body);
    await alert.save();
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

export const deleteAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const alert = await WasteAlert.findOneAndDelete({ _id: req.params.id, ...filter });
    if (!alert) return res.status(404).json({ success: false, error: { message: 'Alert not found' } });
    
    res.json({ success: true, data: { message: 'Alert deleted successfully' } });
  } catch (error) { next(error); }
};
