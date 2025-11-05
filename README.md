# Expo Assignment App

This Expo app demonstrates the following requirements:

## Requirements Met:

1. **React Hooks**: Uses `useState()` and `useEffect()` in `app/index.js`
   - `useState` for managing input values
   - `useEffect` to log counter changes

2. **Parent-Child Component Relationship**: 
   - `ItemList` (parent component) renders multiple `ItemCard` (child component) instances
   - Located in `components/ItemList.js` and `components/ItemCard.js`

3. **Multiple Pages with Navigation**:
   - Home page: `app/index.js`
   - About page: `app/about.js`
   - Navigation using expo-router's `Link` component

4. **Redux Store and Reducer**:
   - Redux store: `store/store.js`
   - Redux slice: `store/counterSlice.js`
   - Uses `dispatch` to update state and `useSelector` to consume state
   - Actions: increment, decrement, incrementByAmount, addItem, removeItem

## How to Run:

1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   - Press `w` for web
   - Press `a` for Android (requires Android emulator or device)
   - Press `i` for iOS (requires macOS and iOS simulator)
   - Scan QR code with Expo Go app on your mobile device

## Project Structure:

```
expo-assignment/
├── app/
│   ├── _layout.js      # Root layout with Redux Provider
│   ├── index.js        # Home page
│   └── about.js        # About page
├── components/
│   ├── ItemCard.js     # Child component
│   └── ItemList.js     # Parent component
├── store/
│   ├── store.js        # Redux store configuration
│   └── counterSlice.js # Redux reducer slice
└── package.json
```

## Features:

- **Counter**: Increment/decrement counter with Redux
- **Items List**: Add and remove items with parent-child component relationship
- **Navigation**: Navigate between Home and About pages
- **State Persistence**: Redux state persists across page navigation

