import express from 'express';
import * as teamController from '../controllers/team.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/roles';

const router = express.Router();

// All team routes require authentication
router.use(authenticate);

// Team management
router.get('/', teamController.getUserTeams);
router.post('/', teamController.createTeam);
router.get('/:id', teamController.getTeamById);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

// Team member management
router.get('/:id/members', teamController.getTeamMembers);
router.post('/:id/members', teamController.addTeamMember);
router.put('/:id/members/:memberId', teamController.updateTeamMember);
router.delete('/:id/members/:memberId', teamController.removeTeamMember);
router.put('/:id/transfer-ownership', teamController.transferOwnership);

// Team invitations
router.get('/:id/invitations', teamController.getTeamInvitations);
router.post('/:id/invitations', teamController.createInvitation);
router.delete('/:id/invitations/:invitationId', teamController.cancelInvitation);

// Personal invitations
router.get('/invitations', teamController.getUserInvitations);
router.post('/invitations/accept', teamController.acceptInvitation);
router.post('/invitations/decline', teamController.declineInvitation);

export default router; 