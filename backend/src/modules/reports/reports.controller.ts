import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { WasteLog } from '../waste-logs/wasteLog.model';
import { InventoryItem } from '../inventory/inventory.model';
import { PurchaseOrder } from '../purchase-orders/purchaseOrder.model';
import { Supplier } from '../suppliers/supplier.model';
import { format } from 'fast-csv';
import { buildLocationFilter } from '../../utils/locationFilter';

// Helper to get date range
const getDateRange = (req: Request) => {
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const from = req.query.from ? new Date(req.query.from as string) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to };
};

export const getWasteSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { from, to } = getDateRange(req);
    
    const currentPeriod = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
    ]);
    
    const totalWasteCost = currentPeriod[0]?.totalCost || 0;
    const totalWasteEntries = currentPeriod[0]?.count || 0;
    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailyWasteCost = totalWasteCost / days;

    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
    const prevPeriod = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: prevFrom, $lte: prevTo } } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
    ]);
    const previousPeriodCost = prevPeriod[0]?.totalCost || 0;
    const percentageChange = previousPeriodCost === 0 ? 0 : ((totalWasteCost - previousPeriodCost) / previousPeriodCost) * 100;

    const byReason = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$reason', cost: { $sum: '$totalCost' }, count: { $sum: 1 } } },
      { $project: { reason: '$_id', cost: 1, count: 1, _id: 0 } },
      { $sort: { cost: -1 } }
    ]);

    const topWastedItems = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: from, $lte: to } } },
      { $group: { 
          _id: '$inventoryItemId', 
          itemName: { $first: '$itemName' }, 
          totalCost: { $sum: '$totalCost' }, 
          totalQuantity: { $sum: '$quantity' }, 
          unit: { $first: '$unit' } 
      }},
      { $sort: { totalCost: -1 } },
      { $limit: 5 },
      { $project: { _id: 0 } }
    ]);

    const dailyTrend = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: from, $lte: to } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cost: { $sum: '$totalCost' },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', cost: 1, count: 1, _id: 0 } }
    ]);

    res.json({ success: true, data: {
      totalWasteCost, totalWasteEntries, avgDailyWasteCost, previousPeriodCost, percentageChange,
      byReason, topWastedItems, dailyTrend
    }});
  } catch (error) { next(error); }
};

export const getInventoryHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);

    const inventory = await InventoryItem.find({ ...filter, isArchived: false });
    const totalItems = inventory.length;
    let healthyItems = 0;
    let lowStockItems = 0;
    let criticalItems = 0;

    const catMap: Record<string, any> = {};

    inventory.forEach(item => {
      const isCritical = item.currentStock === 0;
      const isLow = item.currentStock > 0 && item.currentStock <= item.parLevel;
      const isHealthy = item.currentStock > item.parLevel;

      if (isCritical) criticalItems++;
      if (isLow) lowStockItems++;
      if (isHealthy) healthyItems++;

      if (!catMap[item.category]) catMap[item.category] = { category: item.category, total: 0, healthy: 0, low: 0, critical: 0 };
      catMap[item.category].total++;
      if (isCritical) catMap[item.category].critical++;
      if (isLow) catMap[item.category].low++;
      if (isHealthy) catMap[item.category].healthy++;
    });

    const healthScore = totalItems === 0 ? 0 : (healthyItems / totalItems) * 100;
    const byCategory = Object.values(catMap);
    
    const mostCriticalItems = await InventoryItem.find({ ...filter, isArchived: false, currentStock: 0 })
      .select('name category parLevel unit')
      .limit(5);

    res.json({ success: true, data: {
      totalItems, healthyItems, lowStockItems, criticalItems, healthScore, byCategory, mostCriticalItems
    }});
  } catch (error) { next(error); }
};

export const getProfitImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    
    const firstLog = await WasteLog.findOne({ ...filter }).sort({ createdAt: 1 });
    if (!firstLog) {
      return res.json({ success: true, data: null, message: "Not enough data" });
    }

    const baselineEnd = new Date(firstLog.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const baselineAgg = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $lte: baselineEnd } } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
    ]);
    const baselineWasteCost = baselineAgg[0]?.totalCost || 0;

    const currentStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const currentAgg = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: currentStart } } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
    ]);
    const currentWasteCost = currentAgg[0]?.totalCost || 0;

    const estimatedMonthlySavings = baselineWasteCost - currentWasteCost;
    const estimatedAnnualSavings = estimatedMonthlySavings * 12;
    const wasteReductionPercent = baselineWasteCost === 0 ? 0 : (estimatedMonthlySavings / baselineWasteCost) * 100;

    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const monthlyTrend = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalCost: { $sum: '$totalCost' },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', totalCost: 1, avgDailyCost: { $divide: ['$totalCost', 30] }, _id: 0 } }
    ]);

    res.json({ success: true, data: {
      baselineWasteCost, currentWasteCost, estimatedMonthlySavings, estimatedAnnualSavings, wasteReductionPercent, monthlyTrend
    }});
  } catch (error) { next(error); }
};

export const getSupplierSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { from, to } = getDateRange(req);

    // Suppliers are global to the owner, so we only filter by userId, not locationId
    const totalSuppliers = await Supplier.countDocuments({ userId: filter.userId, isActive: true });

    const pos = await PurchaseOrder.find({ ...filter, createdAt: { $gte: from, $lte: to } });
    const totalPOsThisPeriod = pos.length;
    let totalPOValue = 0;
    const posByStatus = { draft: 0, sent: 0, received: 0, cancelled: 0 };

    pos.forEach(po => {
      totalPOValue += po.totalEstimatedCost;
      posByStatus[po.status as keyof typeof posByStatus]++;
    });

    const topSuppliers = await PurchaseOrder.aggregate([
      { $match: { ...filter, createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$supplierName', totalOrders: { $sum: 1 }, totalValue: { $sum: '$totalEstimatedCost' } } },
      { $sort: { totalValue: -1 } },
      { $limit: 5 },
      { $project: { supplierName: '$_id', totalOrders: 1, totalValue: 1, _id: 0 } }
    ]);

    res.json({ success: true, data: {
      totalSuppliers, totalPOsThisPeriod, totalPOValue, posByStatus, topSuppliers
    }});
  } catch (error) { next(error); }
};

export const getDailyDigest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);

    const todayAgg = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, cost: { $sum: '$totalCost' }, count: { $sum: 1 } } }
    ]);

    const yestAgg = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } } },
      { $group: { _id: null, cost: { $sum: '$totalCost' } } }
    ]);

    const topItem = await WasteLog.aggregate([
      { $match: { ...filter, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: '$itemName', cost: { $sum: '$totalCost' } } },
      { $sort: { cost: -1 } },
      { $limit: 1 }
    ]);

    const lowStockCount = await InventoryItem.countDocuments({ ...filter, isArchived: false, $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$parLevel'] }] } });
    const criticalStockCount = await InventoryItem.countDocuments({ ...filter, isArchived: false, currentStock: 0 });
    const pendingPOs = await PurchaseOrder.countDocuments({ ...filter, status: 'sent' });

    res.json({ success: true, data: {
      date: new Date().toISOString().split('T')[0],
      wasteCostToday: todayAgg[0]?.cost || 0,
      newWasteEntries: todayAgg[0]?.count || 0,
      wasteCostYesterday: yestAgg[0]?.cost || 0,
      lowStockCount,
      criticalStockCount,
      pendingPOs,
      topWasteItemToday: topItem[0] ? { name: topItem[0]._id, cost: topItem[0].cost } : null
    }});
  } catch (error) { next(error); }
};

export const exportWasteCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const { from, to } = getDateRange(req);

    const logs = await WasteLog.find({ ...filter, createdAt: { $gte: from, $lte: to } })
      .populate('inventoryItemId')
      .sort({ createdAt: -1 });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cafetrack-waste-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv"`);

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    logs.forEach(log => {
      csvStream.write({
        Date: log.createdAt.toISOString(),
        Item: log.itemName,
        Category: (log.inventoryItemId as any)?.category || 'Unknown',
        Quantity: log.quantity,
        Unit: log.unit,
        Reason: log.reason,
        'Cost ₹': log.totalCost.toFixed(2),
        Notes: log.notes || ''
      });
    });

    csvStream.end();
  } catch (error) { next(error); }
};
