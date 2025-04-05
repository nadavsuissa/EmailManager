/**
 * Task model with full Hebrew support
 */

import { User } from './user.model';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
export type TaskSource = 'email' | 'manual' | 'imported';

export interface TaskBase {
  description: string;
  priority?: TaskPriority;
  deadline?: string; // ISO date string
  assignTo?: string; // User ID
  notes?: string;
  status: TaskStatus;
  language?: 'he' | 'en';
  tags?: string[];
  dueTime?: string; // Optional time in 24h format ("14:30")
  reminderSet?: boolean;
  reminderDate?: string; // ISO date string
}

export interface Task extends TaskBase {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string; // User ID
  teamId?: string; // Team ID if shared with a team
  extracted: boolean; // Was this extracted from email
  emailId?: string; // Reference to source email
  sourceType: TaskSource;
  parentTaskId?: string; // For subtasks
  completedAt?: string; // ISO date string
  completedBy?: string; // User ID
  isPublic?: boolean; // Whether task can be viewed by team members
  attachments?: TaskAttachment[];
  parsedDateInfo?: any; // Additional date parsing info for Hebrew dates
  watchers?: string[]; // User IDs of people watching this task
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  attachments?: TaskAttachment[];
}

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedAt: string;
  changedBy: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignTo?: string[];
  createdBy?: string[];
  teamId?: string;
  dueBefore?: string; // ISO date
  dueAfter?: string; // ISO date
  tags?: string[];
  search?: string; // For searching in description and notes
  isCompleted?: boolean;
  isOverdue?: boolean;
}

export interface TaskSort {
  field: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status';
  direction: 'asc' | 'desc';
}

export interface TaskPagination {
  page: number;
  limit: number;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} 