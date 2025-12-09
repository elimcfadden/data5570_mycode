/**
 * Redux Store Configuration
 * 
 * This file sets up the Redux store with:
 * - RTK Query API slice for backend communication
 * - Auth slice for authentication state
 * - UI state slices for local state management
 */

import { configureStore, createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import authReducer from './authSlice';

// ============================================
// UI State Slice
// ============================================
// Manages local UI state that doesn't need to be fetched from API
// e.g., selected month/year for calendar navigation

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    // Calendar navigation state
    selectedMonth: new Date().getMonth() + 1, // 1-12
    selectedYear: 2025, // Default to 2025 per spec (valid: 2025-2026)
    
    // Currently selected date for WorkoutDayScreen
    selectedDate: null,
  },
  reducers: {
    setSelectedMonth: (state, action) => {
      state.selectedMonth = action.payload;
    },
    setSelectedYear: (state, action) => {
      state.selectedYear = action.payload;
    },
    setMonthYear: (state, action) => {
      state.selectedMonth = action.payload.month;
      state.selectedYear = action.payload.year;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
  },
});

// Export UI actions
export const uiActions = uiSlice.actions;

// ============================================
// Configure Store
// ============================================

const store = configureStore({
  reducer: {
    // RTK Query API reducer
    [apiSlice.reducerPath]: apiSlice.reducer,
    
    // Auth state reducer
    auth: authReducer,
    
    // UI state reducer
    ui: uiSlice.reducer,
  },
  // Add RTK Query middleware for caching, invalidation, polling, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export default store;
