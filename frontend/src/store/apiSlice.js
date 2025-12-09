/**
 * RTK Query API Slice
 * 
 * This file defines all API endpoints using RTK Query for automatic
 * caching, loading states, and data fetching.
 * 
 * Endpoints:
 * - Auth: login, register
 * - getMonthWorkouts: GET /api/workouts/month/?year=YYYY&month=MM
 * - getDayWorkout: GET /api/workouts/day/?date=YYYY-MM-DD
 * - saveDayWorkout: POST /api/workouts/day/
 * - getAnalyticsSummary: GET /api/analytics/summary/
 * - getExercises: GET /api/exercises/
 * - createExercise: POST /api/exercises/
 * - getCardioTypes: GET /api/cardio-types/
 * - createCardioType: POST /api/cardio-types/
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '../api/config';

// Custom baseQuery that includes auth token in headers
const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get the token from auth state
    const token = getState().auth?.token;
    
    // If we have a token, include it in the request headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Workout', 'MonthWorkouts', 'Analytics', 'Exercise', 'CardioType'],
  endpoints: (builder) => ({
    
    // ============================================
    // Auth Endpoints
    // ============================================
    
    /**
     * Login with username and password
     * Returns access and refresh tokens
     */
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    /**
     * Register a new user
     * Returns user info and tokens
     */
    register: builder.mutation({
      query: (userData) => ({
        url: '/api/auth/register/',
        method: 'POST',
        body: userData,
      }),
    }),
    
    // ============================================
    // Workout Endpoints
    // ============================================
    
    /**
     * Get workouts for a specific month
     * Used by: CalendarScreen
     * 
     * @param {Object} arg - { year: number, month: number }
     * @returns {Object} { year, month, days_with_workouts, month_total_weight, month_total_reps, month_total_cardio_minutes }
     */
    getMonthWorkouts: builder.query({
      query: ({ year, month }) => `/api/workouts/month/?year=${year}&month=${month}`,
      providesTags: (result, error, { year, month }) => [
        { type: 'MonthWorkouts', id: `${year}-${month}` },
        'Workout', // Also invalidate when any workout changes
      ],
    }),

    /**
     * Get workout for a specific day
     * Used by: WorkoutDayScreen
     * 
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Object} { date, notes, entries, cardio_entries, day_total_weight, day_total_reps, day_total_cardio_minutes }
     */
    getDayWorkout: builder.query({
      query: (date) => `/api/workouts/day/?date=${date}`,
      providesTags: (result, error, date) => [
        { type: 'Workout', id: date },
      ],
    }),

    /**
     * Save workout for a specific day (create or update)
     * Used by: WorkoutDayScreen
     * 
     * @param {Object} body - { date, notes, entries: [...], cardio_entries: [...] }
     * @returns {Object} Updated workout data
     */
    saveDayWorkout: builder.mutation({
      query: (body) => ({
        url: '/api/workouts/day/',
        method: 'POST',
        body,
      }),
      // Invalidate relevant caches after saving
      invalidatesTags: (result, error, { date }) => {
        // Extract year and month from date string
        const [year, month] = date.split('-').map(Number);
        return [
          { type: 'Workout', id: date },
          { type: 'MonthWorkouts', id: `${year}-${month}` },
          'Analytics', // Saving a workout affects analytics totals
        ];
      },
    }),

    /**
     * Get analytics summary (aggregated stats)
     * Used by: AnalyticsScreen
     * 
     * @returns {Object} { by_muscle_group, overall, cardio_overall, by_cardio_type }
     */
    getAnalyticsSummary: builder.query({
      query: () => '/api/analytics/summary/',
      providesTags: ['Analytics'],
    }),

    // ============================================
    // Exercise Endpoints
    // ============================================

    /**
     * Get list of all exercises for the current user
     * Used by: WorkoutDayScreen (for exercise dropdown)
     * 
     * @returns {Array} [{ id, name, muscle_group }]
     */
    getExercises: builder.query({
      query: () => '/api/exercises/',
      providesTags: ['Exercise'],
    }),
    
    /**
     * Create a new exercise
     * Used by: WorkoutDayScreen or a dedicated exercise management screen
     * 
     * @param {Object} body - { name, muscle_group }
     * @returns {Object} Created exercise
     */
    createExercise: builder.mutation({
      query: (body) => ({
        url: '/api/exercises/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Exercise'],
    }),

    // ============================================
    // Cardio Type Endpoints
    // ============================================

    /**
     * Get list of all cardio types for the current user
     * Used by: WorkoutDayScreen (for cardio type dropdown)
     * 
     * @returns {Array} [{ id, name }]
     */
    getCardioTypes: builder.query({
      query: () => '/api/cardio-types/',
      providesTags: ['CardioType'],
    }),
    
    /**
     * Create a new cardio type
     * Used by: WorkoutDayScreen
     * 
     * @param {Object} body - { name }
     * @returns {Object} Created cardio type
     */
    createCardioType: builder.mutation({
      query: (body) => ({
        url: '/api/cardio-types/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CardioType'],
    }),

    // ============================================
    // Analytics History Endpoints
    // ============================================

    /**
     * Get exercise history for growth tracking
     * Used by: AnalyticsScreen (growth chart)
     * 
     * @param {number} exerciseId - ID of the exercise
     * @returns {Object} { exercise: { id, name, muscle_group }, points: [{ date, total_volume, total_reps, avg_weight_per_rep }] }
     */
    getExerciseHistory: builder.query({
      query: (exerciseId) => `/api/analytics/exercise-history/?exercise_id=${exerciseId}`,
      providesTags: (result, error, exerciseId) => [
        { type: 'Analytics', id: `exercise-${exerciseId}` },
      ],
    }),

  }),
});

// Export auto-generated hooks for use in components
export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMonthWorkoutsQuery,
  useGetDayWorkoutQuery,
  useSaveDayWorkoutMutation,
  useGetAnalyticsSummaryQuery,
  useGetExercisesQuery,
  useCreateExerciseMutation,
  useGetCardioTypesQuery,
  useCreateCardioTypeMutation,
  useGetExerciseHistoryQuery,
} = apiSlice;
