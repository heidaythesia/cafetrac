import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { getAIRecommendations } from './ai.controller';
import { roleGuard } from '../../middleware/roleGuard';

const router = Router();

// Only owners and managers should see AI insights
router.use(requireAuth);
router.use(roleGuard(['owner', 'manager']));

router.get('/recommendations', getAIRecommendations);

export default router;
