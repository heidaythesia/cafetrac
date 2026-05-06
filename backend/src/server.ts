import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { initCronJobs } from './services/cron.service';

const startServer = async () => {
  // 1. Basic routes for health checks (always available)
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/ready', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({ status: 'ok', db: dbStatus });
  });

  // 2. Start server listener immediately
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // 3. Attempt DB connection in the background
  try {
    await connectDB();
    initCronJobs();
  } catch (error) {
    console.error('❌ Delayed DB Connection failed. Server is still running but features requiring DB will fail.');
  }
};

startServer();
