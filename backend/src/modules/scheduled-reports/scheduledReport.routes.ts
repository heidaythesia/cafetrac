import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { roleGuard } from '../../middleware/roleGuard';
import { getScheduledReports, createScheduledReport, deleteScheduledReport } from './scheduledReport.controller';

const router = Router();

router.use(requireAuth);
router.use(roleGuard(['owner', 'manager']));

router.get('/', getScheduledReports);
router.post('/', createScheduledReport);
router.delete('/:id', deleteScheduledReport);

export default router;
