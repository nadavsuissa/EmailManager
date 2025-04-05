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