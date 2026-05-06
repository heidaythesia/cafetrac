import { Request, Response, NextFunction } from 'express';
import { Supplier } from './supplier.model';

// Suppliers are global to the owner's account (shared across locations)
const getOwnerId = (req: Request) => req.user!.role === 'owner' ? req.user!.userId : req.user!.ownerId;

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = getOwnerId(req);
    const suppliers = await Supplier.find({ userId: ownerId, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: suppliers });
  } catch (error) { next(error); }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = getOwnerId(req);
    const data = req.body;
    const supplier = await Supplier.create({ ...data, userId: ownerId });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

export const getSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = getOwnerId(req);
    const supplier = await Supplier.findOne({ _id: req.params.id, userId: ownerId, isActive: true });
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    
    res.json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = getOwnerId(req);
    const supplier = await Supplier.findOne({ _id: req.params.id, userId: ownerId, isActive: true });
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    
    Object.assign(supplier, req.body);
    await supplier.save();
    
    res.json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ownerId = getOwnerId(req);
    const supplier = await Supplier.findOne({ _id: req.params.id, userId: ownerId });
    if (!supplier) return res.status(404).json({ success: false, error: { message: 'Supplier not found' } });
    
    supplier.isActive = false;
    await supplier.save();
    
    res.json({ success: true, data: { message: 'Supplier archived' } });
  } catch (error) { next(error); }
};
