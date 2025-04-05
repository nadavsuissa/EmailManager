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
import * as emailService from './services/email.service';

// Initialize Express app
const PORT = config.server.port || 3000;

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
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize email listeners
  try {
    await emailService.initializeEmailListeners();
    console.log('Email listeners initialized');
  } catch (error) {
    console.error('Error initializing email listeners:', error);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Disconnect email listeners
  emailService.shutdownEmailConnections();
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  
  // Disconnect email listeners
  emailService.shutdownEmailConnections();
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default server; 