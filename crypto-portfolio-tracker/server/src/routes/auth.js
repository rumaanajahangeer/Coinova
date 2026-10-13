import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import User, { CURRENCIES } from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

const registerSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().trim().max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(200),
  password: z.string().min(1, 'Password is required').max(128),
});

const profileSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    currency: z.enum(CURRENCIES).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'Nothing to update');

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, name } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      throw new HttpError(409, 'An account with this email already exists. Please log in.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: normalizedEmail, passwordHash, name: name || '' });
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  })
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new HttpError(401, 'Invalid email or password');
    res.json({ token: signToken(user), user: user.toPublic() });
  })
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updates = profileSchema.parse(req.body);
    Object.assign(req.user, updates);
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  })
);

export default router;
