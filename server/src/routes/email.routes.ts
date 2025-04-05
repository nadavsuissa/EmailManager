import express from 'express';
import * as emailController from '../controllers/email.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roles';

const router = express.Router();

// All email routes require authentication
router.use(authenticate);

// Email processing routes
router.post('/process', emailController.processEmail);
router.post('/analyze', emailController.analyzeEmail);
router.post('/extract-tasks', emailController.extractTasksFromEmail);

// Email management routes
router.get('/', emailController.getAllEmails);
router.get('/:id', emailController.getEmailById);
router.get('/thread/:threadId', emailController.getEmailsInThread);
router.post('/send', emailController.sendEmail);
router.post('/reply', emailController.replyToEmail);
router.post('/forward', emailController.forwardEmail);
router.post('/draft', emailController.saveDraft);

// Email template routes
router.get('/templates', emailController.getEmailTemplates);
router.post('/templates', emailController.createEmailTemplate);
router.put('/templates/:id', emailController.updateEmailTemplate);
router.delete('/templates/:id', emailController.deleteEmailTemplate);

// Email account routes (admin only)
router.get('/accounts', checkRole('admin'), emailController.getEmailAccounts);
router.post('/accounts', checkRole('admin'), emailController.addEmailAccount);
router.put('/accounts/:id', checkRole('admin'), emailController.updateEmailAccount);
router.delete('/accounts/:id', checkRole('admin'), emailController.deleteEmailAccount);

export default router; 