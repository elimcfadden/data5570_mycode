/**
 * Sign In Screen
 * 
 * Allows users to log in with username and password.
 * On success, stores JWT tokens and navigates to main app.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../store/apiSlice';
import { setCredentials } from '../store/authSlice';

const loginBg = require('../../assets/images/gymdh-login-bg.jpg');

export default function SignInScreen({ navigation }) {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSignIn = async () => {
    // Clear previous error
    setError('');
    
    // Validate inputs
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    try {
      // Call login API
      const result = await login({ username: username.trim(), password }).unwrap();
      
      // Store credentials in Redux
      dispatch(setCredentials({
        token: result.access,
        refreshToken: result.refresh,
        user: { username: username.trim() },
      }));
      
      // Navigation will happen automatically due to conditional rendering in App.js
    } catch (err) {
      console.error('Login error:', err);
      if (err.data?.detail) {
        setError(err.data.detail);
      } else if (err.data?.error) {
        setError(err.data.error);
      } else {
        setError('Invalid username or password');
      }
    }
  };
  
  return (
    <ImageBackground source={loginBg} style={styles.backgroundImage}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* GYMDH Branding */}
            <View style={styles.brandContainer}>
              <Text style={styles.brandTitle}>GYMDH</Text>
              <Text style={styles.brandSubtitle}>No BS Fitness Tracking to have them 'mirin</Text>
              <Text style={styles.brandFeatures}>| Simple Tracking | Customizable Exercises | Built-in Analytics |</Text>
            </View>
            
            {/* Auth Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Sign in to continue</Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter username"
                  placeholderTextColor="#6b7280"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Enter password"
                  placeholderTextColor="#6b7280"
                />
              </View>
              
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 6,
    textShadowColor: 'rgba(168, 85, 247, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  brandFeatures: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#f9fafb',
  },
  button: {
    backgroundColor: '#a855f7',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  linkText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
});
