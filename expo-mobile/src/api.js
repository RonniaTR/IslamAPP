import axios from 'axios';

// Replace YOUR_LOCAL_IP with your machine's LAN IP Address (e.g., 192.168.1.100)
// React Native needs the explicit IP address, not "localhost" or "127.0.0.1", when running on a physical device.
// Web can still use localhost.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
