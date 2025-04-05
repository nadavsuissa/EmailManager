/**
 * Interface representing a team in the system
 */
export interface Team {
  id?: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  settings?: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team member with role
 */
export interface TeamMember {
  userId: string;
  role: TeamRole;
  displayName?: string;
  email?: string;
  joinedAt: Date;
}

/**
 * Team roles
 */
export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

/**
 * Team settings
 */
export interface TeamSettings {
  isPublic: boolean;
  allowExternalMembers: boolean;
  defaultTaskAssignee?: string;
  language: string;
  theme?: string;
  customFields?: Record<string, any>;
}

/**
 * Team invitation
 */
export interface TeamInvitation {
  id?: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Invitation status
 */
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  REVOKED = 'revoked'
} 