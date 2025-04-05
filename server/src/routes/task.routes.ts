import express from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roles';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with filtering, sorting, and pagination
 * @access  Private
 */
router.get('/', taskController.getAllTasks);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:taskId', taskController.getTaskById);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', taskController.createTask);

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update an existing task
 * @access  Private
 */
router.put('/:taskId', taskController.updateTask);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:taskId', taskController.deleteTask);

/**
 * @route   PUT /api/tasks/:taskId/assign
 * @desc    Assign a task to a user
 * @access  Private
 */
router.put('/:taskId/assign', taskController.assignTask);

/**
 * @route   PUT /api/tasks/:taskId/share
 * @desc    Share a task with a team
 * @access  Private
 */
router.put('/:taskId/share', taskController.shareTaskWithTeam);

/**
 * @route   PUT /api/tasks/:taskId/tags
 * @desc    Update tags for a task
 * @access  Private
 */
router.put('/:taskId/tags', taskController.updateTaskTags);

/**
 * @route   PUT /api/tasks/:taskId/reminder
 * @desc    Set a reminder for a task
 * @access  Private
 */
router.put('/:taskId/reminder', taskController.setTaskReminder);

export default router; 