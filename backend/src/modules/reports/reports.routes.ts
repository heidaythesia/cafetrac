import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as Controller from './reports.controller';

const router = Router();

router.use(requireAuth);

router.get('/waste-summary', Controller.getWasteSummary);
router.get('/inventory-health', Controller.getInventoryHealth);
router.get('/profit-impact', Controller.getProfitImpact);
router.get('/supplier-summary', Controller.getSupplierSummary);
router.get('/daily-digest', Controller.getDailyDigest);
router.get('/export/waste-csv', Controller.exportWasteCSV);

export default router;
