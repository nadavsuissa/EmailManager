import express from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roles';

const router = express.Router();

// All AI routes require authentication
router.use(authenticate);

// Task extraction and analysis
router.post('/extract-tasks', aiController.extractTasks);
router.post('/analyze-email', aiController.analyzeEmail);
router.post('/analyze-priority', aiController.analyzeTaskPriority);

// Email generation
router.post('/generate-followup', aiController.generateFollowupEmail);
router.post('/generate-response', aiController.generateResponseToEmail);

// Text processing
router.post('/summarize', aiController.summarizeText);
router.post('/detect-language', aiController.detectLanguage);
router.post('/translate', aiController.translateText);

export default router; 