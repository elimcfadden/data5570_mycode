/**
 * API Configuration
 * 
 * Contains the base URL for the Django backend API.
 * 
 * IMPORTANT: Update BASE_URL to your actual LAN IP address when testing
 * on a physical device or emulator. The Django server must be accessible
 * from the device.
 * 
 * Examples:
 * - For Android emulator: "http://10.0.2.2:8000" (special alias for localhost)
 * - For iOS simulator: "http://localhost:8000"
 * - For physical device: "http://YOUR_LAN_IP:8000" (e.g., "http://192.168.1.100:8000")
 * 
 * To find your LAN IP:
 * - Windows: Run `ipconfig` in terminal, look for IPv4 Address
 * - Mac/Linux: Run `ifconfig` or `ip addr`
 */

// For browser/web testing, use localhost
// For mobile device testing, replace with your LAN IP
export const BASE_URL = "http://127.0.0.1:8000";

// API endpoint paths
export const API_ENDPOINTS = {
  MONTH_WORKOUTS: "/api/workouts/month/",
  DAY_WORKOUT: "/api/workouts/day/",
  ANALYTICS_SUMMARY: "/api/analytics/summary/",
  EXERCISES: "/api/exercises/",
};

