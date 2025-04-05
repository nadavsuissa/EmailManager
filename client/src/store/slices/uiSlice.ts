import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the UI state interface
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
  currentLanguage: 'he' | 'en';
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  dismissed: boolean;
}

// Define the initial state
const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  notifications: [],
  isLoading: false,
  currentLanguage: 'he', // Default to Hebrew
};

// Create the UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'dismissed'>>) => {
      const id = Date.now().toString();
      state.notifications.push({
        ...action.payload,
        id,
        dismissed: false,
      });
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex((n) => n.id === action.payload);
      if (index !== -1) {
        state.notifications[index].dismissed = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'he' | 'en'>) => {
      state.currentLanguage = action.payload;
    },
  },
});

// Export actions and reducer
export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  dismissNotification,
  clearNotifications,
  setLoading,
  setLanguage,
} = uiSlice.actions;

export default uiSlice.reducer; 