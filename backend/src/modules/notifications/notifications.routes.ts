import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as Controller from './notifications.controller';

const router = Router();

router.use(requireAuth);

router.post('/subscribe', Controller.subscribe);
router.delete('/unsubscribe', Controller.unsubscribe);
router.get('/', Controller.getNotifications);
router.get('/unread-count', Controller.getUnreadCount);
router.patch('/read-all', Controller.markAllAsRead);
router.patch('/:id/read', Controller.markAsRead);

export default router;
