export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  hebrewName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  teams?: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
  settings?: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'he' | 'en';
  emailNotifications: boolean;
  pushNotifications: boolean;
  defaultView: 'board' | 'list' | 'calendar';
  showCompletedTasks: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends UserCredentials {
  displayName: string;
  firstName?: string;
  lastName?: string;
  hebrewName?: string;
}

export interface UserProfile {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  hebrewName?: string;
  photoURL?: string;
  settings?: Partial<UserSettings>;
} 