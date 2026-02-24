require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const rankingRoutes = require('./routes/rankings');
const accountRoutes = require('./routes/account');
const { errorHandler } = require('./middlewares/errorHandler');
const { getPool, closeAllPools } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
}));

app.options('*', cors());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/account', accountRoutes);

app.use(errorHandler);

async function start() {
  try {
    await getPool();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Pulse MuCMS API running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await closeAllPools();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeAllPools();
  process.exit(0);
});

start();
