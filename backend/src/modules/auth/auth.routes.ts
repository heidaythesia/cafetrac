import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { register, login, refresh, logout, forgotPassword, resetPassword } from './auth.controller';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    cafeName: z.string().min(2)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

const forgotSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const resetSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8)
  })
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotSchema), forgotPassword);
router.post('/reset-password', validate(resetSchema), resetPassword);

export default router;
