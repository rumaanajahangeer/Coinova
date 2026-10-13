import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import holdingRoutes from './routes/holdings.js';
import coinRoutes from './routes/coins.js';
import portfolioRoutes from './routes/portfolio.js';
import alertRoutes from './routes/alerts.js';
import walletRoutes from './routes/wallet.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.clientOrigins }));
app.use(express.json({ limit: '100kb' }));
if (config.env !== 'test') app.use(morgan('dev'));

app.use(
  '/api',
  rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false })
);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/holdings', requireAuth, holdingRoutes);
app.use('/api/coins', requireAuth, coinRoutes);
app.use('/api/portfolio', requireAuth, portfolioRoutes);
app.use('/api/alerts', requireAuth, alertRoutes);
app.use('/api/wallet', requireAuth, walletRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
