// API Configuration
// For local development, use your local Django server
// For production, replace with your AWS EC2 instance URL or Cloudflare tunnel URL
import Constants from 'expo-constants';

// Check if we're in development mode
const isDev = __DEV__ || Constants.expoConfig?.extra?.dev === true;

// API base URL - update this for production
// For local development: http://localhost:8000/api
// For AWS EC2: http://your-ec2-ip:8000/api
// For Cloudflare tunnel: https://your-tunnel-url.com/api
const API_BASE_URL = isDev
  ? 'http://localhost:8000/api'
  : 'https://your-ec2-instance-url.com/api';

export default API_BASE_URL;

