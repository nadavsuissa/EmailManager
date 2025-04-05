import express from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roles';

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/password-reset', userController.requestPasswordReset);
router.post('/password-reset/confirm', userController.resetPassword);

// Protected routes - require authentication
router.get('/me', authenticate, userController.getCurrentUser);
router.put('/me', authenticate, userController.updateCurrentUser);
router.put('/me/password', authenticate, userController.changePassword);
router.put('/me/settings', authenticate, userController.updateUserSettings);

// Admin routes - require authentication and admin role
router.get('/', authenticate, checkRole('admin'), userController.getAllUsers);
router.get('/:id', authenticate, checkRole('admin'), userController.getUserById);
router.post('/', authenticate, checkRole('admin'), userController.createUser);
router.put('/:id', authenticate, checkRole('admin'), userController.updateUser);
router.delete('/:id', authenticate, checkRole('admin'), userController.deleteUser);
router.put('/:id/role', authenticate, checkRole('admin'), userController.updateUserRole);
router.put('/:id/status', authenticate, checkRole('admin'), userController.updateUserStatus);

export default router; 