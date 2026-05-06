import axios from 'axios';
import { getAccessToken, setAccessToken } from '../../auth/tokenStore';
import { refreshClient } from './refreshClient';

export const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/v1`,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const locationId = localStorage.getItem('selectedLocationId');
  if (locationId) {
    config.params = { ...config.params, locationId };
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return client(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await refreshClient.post('/auth/refresh');
        const token = data.data.accessToken;
        setAccessToken(token);
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        setAccessToken(null);
        // Dispatch custom event to tell AuthProvider to logout
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
