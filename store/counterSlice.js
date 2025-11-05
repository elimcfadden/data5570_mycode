import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: 0,
  items: [],
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    removeItem: (state, action) => {
      state.items = state.items.filter((item, index) => index !== action.payload);
    },
  },
});

export const { increment, decrement, incrementByAmount, addItem, removeItem } = counterSlice.actions;

export default counterSlice.reducer;

