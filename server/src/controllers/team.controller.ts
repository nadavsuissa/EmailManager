import { Request, Response, NextFunction } from 'express';
import { firestore } from '../firebase/admin';
import { v4 as uuidv4 } from 'uuid';
import { createBadRequestError, createNotFoundError, createAuthorizationError } from '../middleware/errorHandler';
import { Team, TeamMember, TeamRole, TeamInvitation, InvitationStatus } from '../models/team.model';

// Collection references
const teamsCollection = firestore.collection('teams');
const invitationsCollection = firestore.collection('teamInvitations');
const usersCollection = firestore.collection('users');

/**
 * Get all teams for the current user
 */
export const getUserTeams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Query teams where user is a member
    const teamSnapshot = await teamsCollection
      .where(`members.${userId}`, '!=', null)
      .get();
    
    // Format results and include member counts
    const teams = await Promise.all(teamSnapshot.docs.map(async (doc) => {
      const teamData = doc.data() as Partial<Team>;
      const membersCount = teamData.members ? Object.keys(teamData.members).length : 0;
      
      return {
        id: doc.id,
        name: teamData.name,
        description: teamData.description,
        ownerId: teamData.ownerId,
        membersCount,
        userRole: teamData.members?.[userId]?.role || 'member',
        settings: teamData.settings,
        createdAt: teamData.createdAt,
        updatedAt: teamData.updatedAt
      };
    }));
    
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single team by ID
 */
export const getTeamById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user is a member of the team
    const members = teamData.members || {};
    if (!members[userId] && teamData.ownerId !== userId) {
      return next(createAuthorizationError('You are not a member of this team'));
    }
    
    // Format members for response
    const formattedMembers = Object.entries(members).map(([uid, memberData]) => ({
      userId: uid,
      ...memberData
    }));
    
    const team = {
      id: teamDoc.id,
      name: teamData.name,
      description: teamData.description,
      ownerId: teamData.ownerId,
      members: formattedMembers,
      settings: teamData.settings,
      createdAt: teamData.createdAt,
      updatedAt: teamData.updatedAt
    };
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new team
 */
export const createTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, settings } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!name) {
      return next(createBadRequestError('Team name is required'));
    }
    
    // Get user information for the member object
    const userDoc = await usersCollection.doc(userId).get();
    const userData = userDoc.data();
    
    // Create the team with the owner as the first member
    const members = {};
    members[userId] = {
      role: TeamRole.OWNER,
      displayName: userData?.displayName || `User ${userId}`,
      email: userData?.email,
      joinedAt: new Date()
    };
    
    const teamData = {
      name,
      description: description || '',
      ownerId: userId,
      members,
      settings: {
        isPublic: false,
        allowExternalMembers: false,
        language: 'he',
        ...(settings || {})
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to Firestore
    const teamRef = await teamsCollection.add(teamData);
    
    res.status(201).json({
      success: true,
      data: {
        id: teamRef.id,
        ...teamData,
        members: Object.entries(members).map(([uid, memberData]) => ({
          userId: uid,
          ...memberData
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a team
 */
export const updateTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, settings } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user is an admin or owner
    const members = teamData.members || {};
    const userRole = members[userId]?.role;
    
    if (teamData.ownerId !== userId && userRole !== TeamRole.ADMIN) {
      return next(createAuthorizationError('You do not have permission to update this team'));
    }
    
    // Create update data object
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    // Update settings if provided, merging with existing settings
    if (settings) {
      updateData.settings = {
        ...(teamData.settings || {}),
        ...settings
      };
    }
    
    // Update in Firestore
    await teamsCollection.doc(id).update(updateData);
    
    // Get the updated team
    const updatedTeamDoc = await teamsCollection.doc(id).get();
    const updatedTeamData = updatedTeamDoc.data() as Partial<Team>;
    
    // Format members for response
    const formattedMembers = Object.entries(updatedTeamData.members || {}).map(([uid, memberData]) => ({
      userId: uid,
      ...memberData
    }));
    
    const team = {
      id: updatedTeamDoc.id,
      ...updatedTeamData,
      members: formattedMembers
    };
    
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a team
 */
export const deleteTeam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Only the owner can delete a team
    if (teamData.ownerId !== userId) {
      return next(createAuthorizationError('Only the team owner can delete the team'));
    }
    
    // Delete all invitations for this team
    const invitationSnapshot = await invitationsCollection
      .where('teamId', '==', id)
      .get();
    
    const batch = firestore.batch();
    
    invitationSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the team document
    batch.delete(teamsCollection.doc(id));
    
    // Commit the batch
    await batch.commit();
    
    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all members of a team
 */
export const getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user is a member of the team
    const members = teamData.members || {};
    if (!members[userId] && teamData.ownerId !== userId) {
      return next(createAuthorizationError('You are not a member of this team'));
    }
    
    // Format members for response
    const formattedMembers = Object.entries(members).map(([uid, memberData]) => ({
      userId: uid,
      ...memberData
    }));
    
    res.status(200).json({
      success: true,
      count: formattedMembers.length,
      data: formattedMembers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a member to a team
 */
export const addTeamMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId: newMemberId, role } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!newMemberId) {
      return next(createBadRequestError('User ID is required'));
    }
    
    // Validate role
    const memberRole = role || TeamRole.MEMBER;
    if (!Object.values(TeamRole).includes(memberRole)) {
      return next(createBadRequestError('Invalid role'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user has permission to add members
    const members = teamData.members || {};
    const userRole = members[userId]?.role;
    
    if (teamData.ownerId !== userId && 
       (userRole !== TeamRole.ADMIN && userRole !== TeamRole.OWNER)) {
      return next(createAuthorizationError('You do not have permission to add members'));
    }
    
    // Check if the member already exists
    if (members[newMemberId]) {
      return next(createBadRequestError('User is already a member of this team'));
    }
    
    // Get new member's user info
    const newMemberDoc = await usersCollection.doc(newMemberId).get();
    
    if (!newMemberDoc.exists) {
      return next(createNotFoundError('User not found'));
    }
    
    const newMemberData = newMemberDoc.data();
    
    // Add the new member
    const newMember = {
      role: memberRole,
      displayName: newMemberData?.displayName || `User ${newMemberId}`,
      email: newMemberData?.email,
      joinedAt: new Date()
    };
    
    // Update Firestore
    await teamsCollection.doc(id).update({
      [`members.${newMemberId}`]: newMember,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: {
        userId: newMemberId,
        ...newMember
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a team member's role
 */
export const updateTeamMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!role) {
      return next(createBadRequestError('Role is required'));
    }
    
    // Validate role
    if (!Object.values(TeamRole).includes(role)) {
      return next(createBadRequestError('Invalid role'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user has permission to update members
    const members = teamData.members || {};
    const userRole = members[userId]?.role;
    
    if (teamData.ownerId !== userId && 
       (userRole !== TeamRole.ADMIN && userRole !== TeamRole.OWNER)) {
      return next(createAuthorizationError('You do not have permission to update members'));
    }
    
    // Cannot change the owner's role
    if (memberId === teamData.ownerId && role !== TeamRole.OWNER) {
      return next(createBadRequestError('Cannot change the owner\'s role'));
    }
    
    // Cannot change your own role unless you're the owner
    if (memberId === userId && teamData.ownerId !== userId) {
      return next(createBadRequestError('You cannot change your own role'));
    }
    
    // Check if the member exists
    if (!members[memberId]) {
      return next(createNotFoundError('Member not found in this team'));
    }
    
    // Update the member's role
    await teamsCollection.doc(id).update({
      [`members.${memberId}.role`]: role,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        userId: memberId,
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a member from a team
 */
export const removeTeamMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user has permission to remove members
    const members = teamData.members || {};
    const userRole = members[userId]?.role;
    
    if (teamData.ownerId !== userId && 
       (userRole !== TeamRole.ADMIN && userRole !== TeamRole.OWNER) &&
       userId !== memberId) { // Allow members to remove themselves
      return next(createAuthorizationError('You do not have permission to remove members'));
    }
    
    // Cannot remove the owner
    if (memberId === teamData.ownerId) {
      return next(createBadRequestError('Cannot remove the team owner'));
    }
    
    // Check if the member exists
    if (!members[memberId]) {
      return next(createNotFoundError('Member not found in this team'));
    }
    
    // Remove the member
    await teamsCollection.doc(id).update({
      [`members.${memberId}`]: firestore.FieldValue.delete(),
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Transfer team ownership
 */
export const transferOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newOwnerId } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!newOwnerId) {
      return next(createBadRequestError('New owner ID is required'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Only the current owner can transfer ownership
    if (teamData.ownerId !== userId) {
      return next(createAuthorizationError('Only the team owner can transfer ownership'));
    }
    
    // Check if the new owner is a member
    const members = teamData.members || {};
    if (!members[newOwnerId]) {
      return next(createNotFoundError('New owner must be a member of the team'));
    }
    
    // Update the team
    await teamsCollection.doc(id).update({
      ownerId: newOwnerId,
      [`members.${newOwnerId}.role`]: TeamRole.OWNER,
      [`members.${userId}.role`]: TeamRole.ADMIN, // Demote current owner to admin
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Team ownership transferred successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create an invitation to join a team
 */
export const createInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, role, expiresIn } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!email) {
      return next(createBadRequestError('Email is required'));
    }
    
    // Validate role
    const memberRole = role || TeamRole.MEMBER;
    if (!Object.values(TeamRole).includes(memberRole)) {
      return next(createBadRequestError('Invalid role'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user has permission to invite members
    const members = teamData.members || {};
    const userRole = members[userId]?.role;
    
    if (teamData.ownerId !== userId && 
       (userRole !== TeamRole.ADMIN && userRole !== TeamRole.OWNER)) {
      return next(createAuthorizationError('You do not have permission to invite members'));
    }
    
    // Check if there's an existing invitation for this email
    const existingInvitation = await invitationsCollection
      .where('teamId', '==', id)
      .where('email', '==', email)
      .where('status', '==', InvitationStatus.PENDING)
      .limit(1)
      .get();
    
    if (!existingInvitation.empty) {
      return next(createBadRequestError('An invitation has already been sent to this email'));
    }
    
    // Check if this email is already a member
    const memberExists = Object.values(members).some(
      (member: any) => member.email === email
    );
    
    if (memberExists) {
      return next(createBadRequestError('This user is already a member of the team'));
    }
    
    // Create an expiration date (default: 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 7));
    
    // Create the invitation
    const invitationData: Partial<TeamInvitation> = {
      teamId: id,
      email,
      role: memberRole,
      invitedBy: userId,
      token: uuidv4(), // Generate a unique token
      status: InvitationStatus.PENDING,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save to Firestore
    const invitationRef = await invitationsCollection.add(invitationData);
    
    // In a real application, we would send an email to the invitee
    
    res.status(201).json({
      success: true,
      data: {
        id: invitationRef.id,
        ...invitationData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending invitations for a team
 */
export const getTeamInvitations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user has permission to view invitations
    const members = teamData.members || {};
    const userRole = members[userId]?.role;
    
    if (teamData.ownerId !== userId && 
       (userRole !== TeamRole.ADMIN && userRole !== TeamRole.OWNER)) {
      return next(createAuthorizationError('You do not have permission to view invitations'));
    }
    
    // Get pending invitations
    const invitationSnapshot = await invitationsCollection
      .where('teamId', '==', id)
      .where('status', '==', InvitationStatus.PENDING)
      .get();
    
    const invitations = invitationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an invitation
 */
export const cancelInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, invitationId } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get the invitation
    const invitationDoc = await invitationsCollection.doc(invitationId).get();
    
    if (!invitationDoc.exists) {
      return next(createNotFoundError('Invitation not found'));
    }
    
    const invitationData = invitationDoc.data() as Partial<TeamInvitation>;
    
    // Check that this invitation belongs to the specified team
    if (invitationData.teamId !== id) {
      return next(createBadRequestError('Invitation does not belong to this team'));
    }
    
    // Get the team
    const teamDoc = await teamsCollection.doc(id).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    const teamData = teamDoc.data() as Partial<Team>;
    
    // Check if user has permission to cancel invitations
    const members = teamData.members || {};
    const userRole = members[userId]?.role;
    
    if (teamData.ownerId !== userId && 
       (userRole !== TeamRole.ADMIN && userRole !== TeamRole.OWNER) &&
       invitationData.invitedBy !== userId) {
      return next(createAuthorizationError('You do not have permission to cancel this invitation'));
    }
    
    // Update the invitation status
    await invitationsCollection.doc(invitationId).update({
      status: InvitationStatus.REVOKED,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!token) {
      return next(createBadRequestError('Invitation token is required'));
    }
    
    // Get the invitation by token
    const invitationSnapshot = await invitationsCollection
      .where('token', '==', token)
      .where('status', '==', InvitationStatus.PENDING)
      .limit(1)
      .get();
    
    if (invitationSnapshot.empty) {
      return next(createNotFoundError('Invalid or expired invitation'));
    }
    
    const invitationDoc = invitationSnapshot.docs[0];
    const invitationData = invitationDoc.data() as Partial<TeamInvitation>;
    
    // Check if invitation has expired
    if (invitationData.expiresAt?.toDate() < new Date()) {
      await invitationsCollection.doc(invitationDoc.id).update({
        status: InvitationStatus.EXPIRED,
        updatedAt: new Date()
      });
      return next(createBadRequestError('Invitation has expired'));
    }
    
    // Get user information
    const userDoc = await usersCollection.doc(userId).get();
    const userData = userDoc.data();
    
    // Check if the invitation email matches the user's email
    if (userData?.email !== invitationData.email) {
      return next(createBadRequestError('This invitation was sent to a different email address'));
    }
    
    // Get the team
    const teamId = invitationData.teamId;
    const teamDoc = await teamsCollection.doc(teamId).get();
    
    if (!teamDoc.exists) {
      return next(createNotFoundError('Team not found'));
    }
    
    // Add user to team
    await teamsCollection.doc(teamId).update({
      [`members.${userId}`]: {
        role: invitationData.role,
        displayName: userData?.displayName || `User ${userId}`,
        email: userData?.email,
        joinedAt: new Date()
      },
      updatedAt: new Date()
    });
    
    // Update invitation status
    await invitationsCollection.doc(invitationDoc.id).update({
      status: InvitationStatus.ACCEPTED,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'You have joined the team',
      data: {
        teamId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Decline an invitation
 */
export const declineInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    if (!token) {
      return next(createBadRequestError('Invitation token is required'));
    }
    
    // Get the invitation by token
    const invitationSnapshot = await invitationsCollection
      .where('token', '==', token)
      .where('status', '==', InvitationStatus.PENDING)
      .limit(1)
      .get();
    
    if (invitationSnapshot.empty) {
      return next(createNotFoundError('Invalid or expired invitation'));
    }
    
    const invitationDoc = invitationSnapshot.docs[0];
    const invitationData = invitationDoc.data() as Partial<TeamInvitation>;
    
    // Get user information
    const userDoc = await usersCollection.doc(userId).get();
    const userData = userDoc.data();
    
    // Check if the invitation email matches the user's email
    if (userData?.email !== invitationData.email) {
      return next(createBadRequestError('This invitation was sent to a different email address'));
    }
    
    // Update invitation status
    await invitationsCollection.doc(invitationDoc.id).update({
      status: InvitationStatus.DECLINED,
      updatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's pending invitations
 */
export const getUserInvitations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return next(createAuthorizationError('User not authenticated'));
    }
    
    // Get user's email
    const userDoc = await usersCollection.doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.email) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Get pending invitations for this email
    const invitationSnapshot = await invitationsCollection
      .where('email', '==', userData.email)
      .where('status', '==', InvitationStatus.PENDING)
      .get();
    
    // Get team information for each invitation
    const invitations = await Promise.all(invitationSnapshot.docs.map(async (doc) => {
      const invitationData = doc.data() as Partial<TeamInvitation>;
      const teamDoc = await teamsCollection.doc(invitationData.teamId).get();
      const teamData = teamDoc.data() as Partial<Team>;
      
      // Get inviter information
      let inviterName = 'Unknown';
      if (invitationData.invitedBy) {
        const inviterDoc = await usersCollection.doc(invitationData.invitedBy).get();
        const inviterData = inviterDoc.data();
        inviterName = inviterData?.displayName || inviterData?.email || invitationData.invitedBy;
      }
      
      return {
        id: doc.id,
        ...invitationData,
        teamName: teamData?.name,
        inviterName
      };
    }));
    
    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
}; 