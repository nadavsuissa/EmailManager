import { 
  Task as SharedTask, 
  TaskBase as SharedTaskBase,
  TaskPriority, 
  TaskStatus, 
  TaskSource, 
  TaskAttachment as SharedTaskAttachment,
  TaskComment as SharedTaskComment,
  TaskHistoryEntry as SharedTaskHistoryEntry,
  TaskFilter as SharedTaskFilter,
  TaskSort as SharedTaskSort,
  TaskPagination as SharedTaskPagination,
  TasksResponse as SharedTasksResponse
} from '../../../shared/models/task.model';

// Re-export the types from the shared model
export type {
  TaskPriority,
  TaskStatus,
  TaskSource,
  SharedTaskAttachment as TaskAttachment,
  SharedTaskComment as TaskComment,
  SharedTaskHistoryEntry as TaskHistoryEntry,
  SharedTaskPagination as TaskPagination,
  SharedTasksResponse as TasksResponse
};

// Use the same Task type from the shared model
export type Task = SharedTask;

// Use the same TaskBase type from the shared model
export type TaskBase = SharedTaskBase;

// Re-export TaskFilter with client-specific additions if needed
export interface TaskFilter extends SharedTaskFilter {
  // Add any client-specific filter options
  showInProgress?: boolean;
  hideOverdue?: boolean;
  quickFilter?: 'today' | 'week' | 'month' | 'all';
}

// Re-export TaskSort with client-specific additions if needed
export interface TaskSort extends SharedTaskSort {
  // Add any client-specific sort options
  secondarySort?: {
    field: 'createdAt' | 'updatedAt' | 'deadline' | 'priority' | 'status';
    direction: 'asc' | 'desc';
  };
}

// New task form data interface
export interface NewTaskFormData {
  description: string;
  priority?: TaskPriority;
  deadline?: string;
  assignTo?: string;
  notes?: string;
  tags?: string[];
  teamId?: string;
  isPublic?: boolean;
  reminderSet?: boolean;
  reminderDate?: string;
}

// Task update form data interface
export interface UpdateTaskFormData {
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
  assignTo?: string;
  notes?: string;
  status?: TaskStatus;
  tags?: string[];
  teamId?: string;
  isPublic?: boolean;
  reminderSet?: boolean;
  reminderDate?: string;
}

/**
 * Represents a user assigned to a task
 */
export interface TaskAssignee {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
}

/**
 * Priority levels for tasks
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Status values for tasks
 */
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

/**
 * Source type for a task (how it was created)
 */
export type TaskSourceType = 'manual' | 'email' | 'ai' | 'imported';

/**
 * Represents a task in the system
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  
  /** The title of the task */
  title: string;
  
  /** Optional detailed description of the task */
  description?: string;
  
  /** The current status of the task */
  status: TaskStatus;
  
  /** Priority level of the task */
  priority: TaskPriority;
  
  /** Optional due date for the task completion */
  dueDate?: Date | string;
  
  /** Optional user assigned to complete the task */
  assignedTo?: TaskAssignee;
  
  /** Optional team ID if the task is associated with a team */
  teamId?: string;
  
  /** User ID who created the task */
  createdBy: string;
  
  /** When the task was created */
  createdAt: string;
  
  /** When the task was last updated */
  updatedAt: string;
  
  /** The primary language of the task content (en, he) */
  language?: 'en' | 'he';
  
  /** If the task was extracted from an email */
  emailId?: string;
  
  /** Source of the task creation */
  sourceType?: TaskSourceType;
  
  /** Custom labels/tags for the task */
  labels?: string[];
  
  /** Subtasks or checklist items */
  subtasks?: SubTask[];
  
  /** Task comments or notes */
  comments?: TaskComment[];
  
  /** Attachments related to the task */
  attachments?: TaskAttachment[];
}

/**
 * Represents a subtask or checklist item
 */
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

/**
 * Represents a comment on a task
 */
export interface TaskComment {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Represents a file attached to a task
 */
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
} 