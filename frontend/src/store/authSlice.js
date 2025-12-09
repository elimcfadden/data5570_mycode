/**
 * Auth Slice
 * 
 * Manages authentication state including:
 * - JWT tokens (access and refresh)
 * - Current user info
 * - Auth status
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // JWT tokens
  token: null,
  refreshToken: null,
  
  // Current user info
  user: null, // { id, username }
  
  // Auth status
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Store credentials after successful login/register
     * @param {Object} payload - { token, refreshToken?, user }
     */
    setCredentials: (state, action) => {
      const { token, refreshToken, user } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.user = user;
      state.status = 'succeeded';
      state.error = null;
    },
    
    /**
     * Clear all auth state (logout)
     */
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
    
    /**
     * Set loading status
     */
    setLoading: (state) => {
      state.status = 'loading';
      state.error = null;
    },
    
    /**
     * Set error status
     */
    setError: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
  },
});

// Export actions
export const { setCredentials, logout, setLoading, setError } = authSlice.actions;

// Export selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectAuthToken = (state) => state.auth.token;

// Export reducer
export default authSlice.reducer;

