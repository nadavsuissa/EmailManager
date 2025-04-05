import express from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { checkRole, checkOwnerOrAdmin } from '../middleware/roles';

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// Admin routes - these need to come first due to route specificity
router.get('/user/:userId', checkRole('admin'), taskController.getTasksByUser);
router.post('/bulk', checkRole('admin'), taskController.createBulkTasks);
router.delete('/bulk', checkRole('admin'), taskController.deleteBulkTasks);

// Regular user routes
router.get('/', taskController.getAllTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Task actions
router.put('/:id/complete', taskController.completeTask);
router.put('/:id/reopen', taskController.reopenTask);
router.put('/:id/priority', taskController.changeTaskPriority);
router.put('/:id/assign', checkRole('admin'), taskController.assignTask);

export default router; 