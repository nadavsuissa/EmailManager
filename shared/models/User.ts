// User interface
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: Date | number;
  updatedAt: Date | number;
  organization?: string;
  team?: string;
  settings: {
    language: 'he' | 'en';
    emailNotifications: boolean;
    reminderFrequency: 'daily' | 'weekly' | 'custom';
  };
} 