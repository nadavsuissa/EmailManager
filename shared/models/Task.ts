// Task interface with Hebrew support
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'canceled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date | number;
  updatedAt: Date | number;
  dueDate?: Date | number;
  completedAt?: Date | number;
  assignedToUserId: string;
  assignedByUserId: string;
  emailSource?: {
    messageId: string;
    subject: string;
    sender: string;
    receivedAt: Date | number;
  };
  tags: string[];
  language: 'he' | 'en';
  reminderSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'custom';
    nextReminderDate?: Date | number;
    customDays?: number;
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  // For hierarchical tasks
  parentTaskId?: string;
  subTasks?: string[];
} 