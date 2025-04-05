import { Router } from 'express';
import taskRoutes from './task.routes';
import emailRoutes from './email.routes';
import userRoutes from './user.routes';
import aiRoutes from './ai.routes';

const router = Router();

// Health check route
router.get('/', (req, res) => {
  res.json({ message: 'API is operational', timestamp: new Date().toISOString() });
});

// Register all API routes
router.use('/tasks', taskRoutes);
router.use('/emails', emailRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);

export default router; 