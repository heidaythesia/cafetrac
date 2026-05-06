import { Request, Response, NextFunction } from 'express';
import { InventoryItem } from './inventory.model';
import { assertOwnership } from '../../utils/ownershipCheck';
import { buildLocationFilter } from '../../utils/locationFilter';

export const getItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const items = await InventoryItem.find({ ...filter, isArchived: false });
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const createItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const data = req.body;
    
    const ownerId = user.role === 'owner' ? user.userId : user.ownerId;
    const locationId = user.role === 'owner' ? (data.locationId || req.query.locationId) : user.locationId;

    if (!locationId) return res.status(400).json({ success: false, error: { code: 400, message: 'locationId is required' } });

    const item = await InventoryItem.create({ ...data, userId: ownerId, locationId });
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { id } = req.params;
    const data = req.body;

    const item = await InventoryItem.findOne({ _id: id, ...filter });
    if (!item) return res.status(404).json({ success: false, error: { code: 404, message: 'Item not found' } });

    Object.assign(item, data);
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { id } = req.params;

    const item = await InventoryItem.findOne({ _id: id, ...filter });
    if (!item) return res.status(404).json({ success: false, error: { code: 404, message: 'Item not found' } });

    item.isArchived = true;
    await item.save();

    res.json({ success: true, data: { message: 'Item archived' } });
  } catch (error) { next(error); }
};

export const getLowStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const items = await InventoryItem.find({ 
      ...filter, 
      isArchived: false,
      $expr: { $lte: ['$currentStock', '$parLevel'] }
    });
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const stockIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await InventoryItem.findOne({ _id: id, ...filter });
    if (!item) return res.status(404).json({ success: false, error: { code: 404, message: 'Item not found' } });

    item.currentStock += quantity;
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const stockOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await InventoryItem.findOne({ _id: id, ...filter });
    if (!item) return res.status(404).json({ success: false, error: { code: 404, message: 'Item not found' } });

    if (item.currentStock < quantity) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'Insufficient stock' } });
    }

    item.currentStock -= quantity;
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const setAlertThreshold = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { id } = req.params;
    const { alertThreshold } = req.body;

    const item = await InventoryItem.findOne({ _id: id, ...filter });
    if (!item) return res.status(404).json({ success: false, error: { code: 404, message: 'Item not found' } });

    item.alertThreshold = alertThreshold;
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};
