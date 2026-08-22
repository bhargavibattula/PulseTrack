import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// DUMMY VALUE: point this at your backend. On a physical device/emulator this
// cannot be "localhost" — use your machine's LAN IP, e.g. http://192.168.1.20:4000/api/v1
export const API_BASE_URL = 'http://192.168.1.71:4000/api/v1';

const ACCESS_TOKEN_KEY = 'toor_dal_access_token';
const REFRESH_TOKEN_KEY = 'toor_dal_refresh_token';

export const tokenStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try one silent refresh-and-retry before giving up (SRS §6 session handling).
let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
        return api(original);
      }

      isRefreshing = true;
      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw error;
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
        await tokenStorage.setTokens(data.data.access_token, data.data.refresh_token);
        queue.forEach((resolve) => resolve());
        queue = [];
        return api(original);
      } catch (refreshErr) {
        await tokenStorage.clear();
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Small helper so screens can read a consistent error message from any failed call.
export function apiErrorMessage(err: any): string {
  return err?.response?.data?.error?.message || err?.message || 'Something went wrong.';
}
