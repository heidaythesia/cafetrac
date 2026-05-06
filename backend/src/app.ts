import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import wasteLogRoutes from './modules/waste-logs/wasteLog.routes';
import purchaseOrderRoutes from './modules/purchase-orders/purchaseOrder.routes';
import supplierRoutes from './modules/suppliers/supplier.routes';
import reportsRoutes from './modules/reports/reports.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import locationRoutes from './modules/locations/location.routes';
import teamRoutes from './modules/teams/team.routes';
import aiRoutes from './modules/ai/ai.routes';
import wasteAlertRoutes from './modules/waste-alerts/wasteAlert.routes';
import scheduledReportRoutes from './modules/scheduled-reports/scheduledReport.routes';
import { initCronJobs } from './services/cron.service';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';


const app = express();

// 1. Logging (Manual for debugging)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// 2. Swagger Documentation (Before limiters)
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 3. Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API to avoid development noise/blocking
}));

// 3. CORS
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or matching allowedOrigins
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// 3. Body Parser & Cookie Parser
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 4. Body Parser & Cookie Parser
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 5. Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, error: { code: 429, message: 'Too many requests from this IP, please try again after a minute' } }
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window`
  message: { success: false, error: { code: 429, message: 'Too many auth requests from this IP, please try again after a minute' } }
});

app.use('/api', globalLimiter);
app.use('/api/v1/auth', authLimiter);

// 6. Base API Route
app.get('/api/v1', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'CafeTrac API v1 is active',
    timestamp: new Date().toISOString()
  });
});

// 7. Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/waste-logs', wasteLogRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/waste-alerts', wasteAlertRoutes);
app.use('/api/v1/scheduled-reports', scheduledReportRoutes);

// 7. Error Handler
app.use(errorHandler);

export default app;
