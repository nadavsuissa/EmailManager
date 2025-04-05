import express from 'express';
import * as webhookController from '../controllers/webhook.controller';
import { checkApiKey } from '../middleware/apiKey';

const router = express.Router();

// Webhooks are secured by API key, not user authentication
router.use(checkApiKey);

// Email webhooks
router.post('/email/gmail', webhookController.processGmailWebhook);
router.post('/email/outlook', webhookController.processOutlookWebhook);
router.post('/email/custom', webhookController.processCustomWebhook);

// Email tagging webhook
router.post('/email/tag', webhookController.tagEmail);

export default router; 