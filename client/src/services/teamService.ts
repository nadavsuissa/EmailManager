import axios from 'axios';

// API URL from environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Define Team interfaces
interface TeamMember {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  addedAt: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberCount: number;
  userRole: 'owner' | 'admin' | 'member' | 'guest';
  members?: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  invitedEmail: string;
  invitedById: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

interface CreateTeamData {
  name: string;
  description?: string;
}

interface UpdateTeamData {
  name?: string;
  description?: string;
}

interface AddMemberData {
  email: string;
  role?: 'admin' | 'member' | 'guest';
}

interface UpdateMemberData {
  role: 'admin' | 'member' | 'guest';
}

interface CreateInvitationData {
  email: string;
  role?: 'admin' | 'member' | 'guest';
}

/**
 * Get all teams for the current user
 */
export const getTeams = async (): Promise<Team[]> => {
  try {
    const response = await axios.get(`${API_URL}/teams`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    return [];
  }
};

/**
 * Get a team by ID
 */
export const getTeamById = async (teamId: string): Promise<Team> => {
  try {
    const response = await axios.get(`${API_URL}/teams/${teamId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Create a new team
 */
export const createTeam = async (data: CreateTeamData): Promise<Team> => {
  try {
    const response = await axios.post(`${API_URL}/teams`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Update a team
 */
export const updateTeam = async (teamId: string, data: UpdateTeamData): Promise<Team> => {
  try {
    const response = await axios.put(`${API_URL}/teams/${teamId}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Delete a team
 */
export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/teams/${teamId}`);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get all members of a team
 */
export const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
  try {
    const response = await axios.get(`${API_URL}/teams/${teamId}/members`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Add a member to a team
 */
export const addTeamMember = async (teamId: string, data: AddMemberData): Promise<TeamMember> => {
  try {
    const response = await axios.post(`${API_URL}/teams/${teamId}/members`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Update a team member's role
 */
export const updateTeamMember = async (
  teamId: string,
  memberId: string,
  data: UpdateMemberData
): Promise<TeamMember> => {
  try {
    const response = await axios.put(`${API_URL}/teams/${teamId}/members/${memberId}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Remove a member from a team
 */
export const removeTeamMember = async (teamId: string, memberId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/teams/${teamId}/members/${memberId}`);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Transfer team ownership
 */
export const transferOwnership = async (teamId: string, newOwnerId: string): Promise<Team> => {
  try {
    const response = await axios.put(`${API_URL}/teams/${teamId}/transfer-ownership`, {
      newOwnerId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get team invitations
 */
export const getTeamInvitations = async (teamId: string): Promise<TeamInvitation[]> => {
  try {
    const response = await axios.get(`${API_URL}/teams/${teamId}/invitations`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Create a team invitation
 */
export const createInvitation = async (
  teamId: string,
  data: CreateInvitationData
): Promise<TeamInvitation> => {
  try {
    const response = await axios.post(`${API_URL}/teams/${teamId}/invitations`, data);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Cancel a team invitation
 */
export const cancelInvitation = async (teamId: string, invitationId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/teams/${teamId}/invitations/${invitationId}`);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Get user invitations
 */
export const getUserInvitations = async (): Promise<TeamInvitation[]> => {
  try {
    const response = await axios.get(`${API_URL}/teams/invitations`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (invitationId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/teams/invitations/accept`, { invitationId });
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Decline an invitation
 */
export const declineInvitation = async (invitationId: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/teams/invitations/decline`, { invitationId });
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

/**
 * Helper function to handle API errors
 */
const handleApiError = (error: any): void => {
  if (axios.isAxiosError(error) && error.response) {
    const { status, data } = error.response;
    
    if (status === 401) {
      // Unauthorized - handle auth error
      throw new Error('Unauthorized access. Please log in again.');
    }
    
    if (data && data.message) {
      throw new Error(data.message);
    }
  }
  
  throw error instanceof Error ? error : new Error('An unexpected error occurred');
}; 