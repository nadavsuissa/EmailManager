import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import aiRoutes from './routes/ai.routes';
import teamRoutes from './routes/team.routes';
import taskRoutes from './routes/task.routes';
import webhookRoutes from './routes/webhook.routes';

// Initialize Express app
const app = express();

// Set trust proxy for rate limiter to work with proxies like Nginx
app.set('trust proxy', 1);

// Apply security middleware
if (config.security.helmet) {
  app.use(helmet());
}

// Configure CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable compression
app.use(compression());

// Apply rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimiting.windowMs,
  max: config.security.rateLimiting.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use(limiter);

// Set up logging with Morgan
app.use(morgan(config.logging.format));

// Ensure proper UTF-8 encoding for Hebrew support
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    environment: config.environment
  });
});

// Register API routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/webhooks', webhookRoutes);

// 404 route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler must be LAST
app.use(errorHandler);

export default app; 