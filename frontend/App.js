/**
 * Gym Tracker - Main App Component
 * 
 * Sets up:
 * - Redux Provider for global state management
 * - React Navigation with conditional auth flow
 * 
 * Navigation Structure:
 * - If NOT authenticated:
 *   - AuthStack: SignInScreen, SignUpScreen
 * - If authenticated:
 *   - Tabs:
 *     - CalendarTab (Stack Navigator):
 *       - CalendarScreen (home/default)
 *       - WorkoutDayScreen (pushed when tapping a date)
 *     - AnalyticsTab:
 *       - AnalyticsScreen
 */

import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Redux store
import store from './src/store';
import { selectIsAuthenticated } from './src/store/authSlice';
import { logout } from './src/store/authSlice';

// Screens
import CalendarScreen from './src/screens/CalendarScreen';
import WorkoutDayScreen from './src/screens/WorkoutDayScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';

// Tab Icons
const CalendarIconImage = require('./assets/icons/calendar-color-icon.png');
const AnalyticsIconImage = require('./assets/icons/icons8-statistics-50.png');

// Create navigators
const Tab = createBottomTabNavigator();
const CalendarStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

/**
 * Auth Stack Navigator
 * Contains SignIn and SignUp screens
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Calendar Stack Navigator
 * Contains CalendarScreen (home) and WorkoutDayScreen (detail)
 */
function CalendarStackNavigator() {
  const dispatch = useDispatch();
  
  return (
    <CalendarStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0f',
        },
        headerTintColor: '#f9fafb',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <CalendarStack.Screen 
        name="CalendarHome" 
        component={CalendarScreen}
        options={{
          title: 'GYMDH',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => dispatch(logout())}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <CalendarStack.Screen 
        name="WorkoutDay" 
        component={WorkoutDayScreen}
        options={({ route }) => ({
          title: route.params?.date || 'Workout',
        })}
      />
    </CalendarStack.Navigator>
  );
}

/**
 * Main Tab Navigator (authenticated users only)
 * Uses responsive icon sizing based on screen width
 */
function MainNavigator() {
  const { width } = useWindowDimensions();
  
  // Responsive icon size: smaller on narrow screens, larger on wider screens
  // Base size is 24, scales between 20-28 based on screen width
  const getResponsiveIconSize = (baseSize) => {
    if (width < 360) return Math.max(18, baseSize - 6);
    if (width < 400) return Math.max(20, baseSize - 4);
    if (width > 768) return Math.min(28, baseSize + 4);
    return baseSize;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#0a0a0f',
          borderTopWidth: 1,
          borderTopColor: '#1f2937',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // We use stack navigator headers instead
      }}
      initialRouteName="Calendar"
    >
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStackNavigator}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ focused, size }) => {
            const responsiveSize = getResponsiveIconSize(size);
            return (
              <Image 
                source={CalendarIconImage} 
                style={{ 
                  width: responsiveSize, 
                  height: responsiveSize,
                  opacity: focused ? 1 : 0.6,
                }} 
                resizeMode="contain"
              />
            );
          },
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0a0a0f',
          },
          headerTintColor: '#f9fafb',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarIcon: ({ focused, size }) => {
            const responsiveSize = getResponsiveIconSize(size);
            return (
              <Image 
                source={AnalyticsIconImage} 
                style={{ 
                  width: responsiveSize, 
                  height: responsiveSize,
                  opacity: focused ? 1 : 0.6,
                }} 
                resizeMode="contain"
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Navigator - conditionally shows Auth or Main based on auth state
 */
function RootNavigator() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

/**
 * Main App Component
 */
export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 16,
    padding: 8,
  },
  logoutText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
});
