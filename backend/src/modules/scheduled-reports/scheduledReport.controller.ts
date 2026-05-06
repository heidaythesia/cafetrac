import { Request, Response, NextFunction } from 'express';
import { ScheduledReport } from './scheduledReport.model';
import { buildLocationFilter } from '../../utils/locationFilter';

export const getScheduledReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const reports = await ScheduledReport.find({ ...filter }).sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) { next(error); }
};

export const createScheduledReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const ownerId = user.role === 'owner' ? user.userId : user.ownerId;
    const { reportType, frequency, recipients } = req.body;
    
    // Default to the user's current location if not provided
    const locationId = user.locationId || req.query.locationId;
    if (!locationId) return res.status(400).json({ success: false, error: { message: 'locationId is required' } });

    const report = await ScheduledReport.create({
      reportType,
      frequency,
      recipients,
      userId: ownerId,
      locationId: locationId as any
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const deleteScheduledReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = buildLocationFilter(req);
    const report = await ScheduledReport.findOneAndDelete({ _id: req.params.id, ...filter });
    if (!report) return res.status(404).json({ success: false, error: { message: 'Report not found' } });
    res.json({ success: true, data: { message: 'Scheduled report removed' } });
  } catch (error) { next(error); }
};
