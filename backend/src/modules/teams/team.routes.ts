import { Router } from 'express';
import { inviteTeamMember, getTeamMembers, removeTeamMember } from './team.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { roleGuard } from '../../middleware/roleGuard';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const inviteSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['manager', 'staff']),
    locationId: z.string().optional()
  })
});

router.use(requireAuth);
router.use(roleGuard(['owner']));

router.post('/invite', validate(inviteSchema), inviteTeamMember);
router.get('/', getTeamMembers);
router.delete('/:id', removeTeamMember);

export default router;
