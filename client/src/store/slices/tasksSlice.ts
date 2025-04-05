import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskFilter, TaskSort } from '@/types/task';

// Define the tasks state interface
interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  totalTasks: number;
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  sort: TaskSort;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Define the initial state
const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  totalTasks: 0,
  loading: false,
  error: null,
  filter: {},
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  limit: 20,
  hasMore: false,
};

// Create the tasks slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    fetchTasksStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTasksSuccess: (state, action: PayloadAction<{ tasks: Task[]; total: number; hasMore: boolean }>) => {
      state.loading = false;
      state.tasks = action.payload.tasks;
      state.totalTasks = action.payload.total;
      state.hasMore = action.payload.hasMore;
      state.error = null;
    },
    appendTasks: (state, action: PayloadAction<{ tasks: Task[]; hasMore: boolean }>) => {
      state.loading = false;
      state.tasks = [...state.tasks, ...action.payload.tasks];
      state.hasMore = action.payload.hasMore;
      state.error = null;
    },
    fetchTasksFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks = [action.payload, ...state.tasks];
      state.totalTasks += 1;
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      state.tasks = state.tasks.map((task) =>
        task.id === action.payload.id ? action.payload : task
      );
      
      if (state.currentTask && state.currentTask.id === action.payload.id) {
        state.currentTask = action.payload;
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      state.totalTasks -= 1;
      
      if (state.currentTask && state.currentTask.id === action.payload) {
        state.currentTask = null;
      }
    },
    setFilter: (state, action: PayloadAction<TaskFilter>) => {
      state.filter = action.payload;
      state.page = 1; // Reset pagination when filter changes
    },
    setSort: (state, action: PayloadAction<TaskSort>) => {
      state.sort = action.payload;
      state.page = 1; // Reset pagination when sort changes
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
      state.page = 1; // Reset pagination when limit changes
    },
    clearTasks: (state) => {
      state.tasks = [];
      state.totalTasks = 0;
      state.currentTask = null;
      state.page = 1;
      state.hasMore = false;
    },
    clearTasksError: (state) => {
      state.error = null;
    },
  },
});

// Export actions and reducer
export const {
  fetchTasksStart,
  fetchTasksSuccess,
  appendTasks,
  fetchTasksFailure,
  setCurrentTask,
  addTask,
  updateTask,
  deleteTask,
  setFilter,
  setSort,
  setPage,
  setLimit,
  clearTasks,
  clearTasksError,
} = tasksSlice.actions;

export default tasksSlice.reducer; 