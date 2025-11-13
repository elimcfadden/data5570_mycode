import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import customerReducer from './customerSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    customers: customerReducer,
  },
});

