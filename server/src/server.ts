import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import config from '../../shared/config/env';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import apiRoutes from './routes';
import app from './app';
import { config } from './config/env';

// Initialize Express app
const PORT = config.port || 5000;

// Middleware setup
// Security headers
app.use(helmet());

// CORS configuration with support for credentials
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('dev'));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Response compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Ensure proper UTF-8 encoding for Hebrew support
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Authentication middleware (applied to protected routes)
app.use('/api/protected', authMiddleware);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`✅ Server running in ${config.environment} mode on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal (e.g., from Heroku or Docker)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

export default server; 