import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus, TaskPriority } from '../../types/task';
import { RootState } from '../store';
import { api } from '../../services/api';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  currentTask: Task | null;
  filterStatus: TaskStatus | 'all';
  filterPriority: TaskPriority | 'all';
  searchTerm: string;
  view: 'list' | 'board' | 'calendar';
}

// Async thunks for API calls
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      // Replace with actual API call when backend is ready
      const response = await api.get('/tasks');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (task: Partial<Task>, { rejectWithValue }) => {
    try {
      // Replace with actual API call when backend is ready
      const response = await api.post('/tasks', task);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, task }: { id: string; task: Partial<Task> }, { rejectWithValue }) => {
    try {
      // Replace with actual API call when backend is ready
      const response = await api.put(`/tasks/${id}`, task);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      // Replace with actual API call when backend is ready
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

// Initial state
const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
  currentTask: null,
  filterStatus: 'all',
  filterPriority: 'all',
  searchTerm: '',
  view: 'list',
};

// Create slice
export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<TaskStatus | 'all'>) => {
      state.filterStatus = action.payload;
    },
    setFilterPriority: (state, action: PayloadAction<TaskPriority | 'all'>) => {
      state.filterPriority = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setView: (state, action: PayloadAction<'list' | 'board' | 'calendar'>) => {
      state.view = action.payload;
    },
    clearFilters: (state) => {
      state.filterStatus = 'all';
      state.filterPriority = 'all';
      state.searchTerm = '';
    },
  },
  extraReducers: (builder) => {
    // Handle fetchTasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle createTask
    builder
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle updateTask
    builder
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex((task) => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle deleteTask
    builder
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter((task) => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setCurrentTask,
  setFilterStatus,
  setFilterPriority,
  setSearchTerm,
  setView,
  clearFilters,
} = tasksSlice.actions;

// Selectors
export const selectTasks = (state: RootState) => state.tasks.tasks;
export const selectFilteredTasks = (state: RootState) => {
  const { tasks, filterStatus, filterPriority, searchTerm } = state.tasks;
  
  return tasks.filter((task) => {
    // Filter by status
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    
    // Filter by priority
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }
    
    // Search term (case insensitive)
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
};

export const selectLoading = (state: RootState) => state.tasks.loading;
export const selectError = (state: RootState) => state.tasks.error;
export const selectCurrentTask = (state: RootState) => state.tasks.currentTask;
export const selectView = (state: RootState) => state.tasks.view;

export default tasksSlice.reducer; 