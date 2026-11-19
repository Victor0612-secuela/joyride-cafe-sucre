import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

const TOKEN_KEY = 'joyride_access_token';
const REFRESH_KEY = 'joyride_refresh_token';

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function setStoredTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
  const { accessToken } = getStoredTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = axios
          .post('/api/auth/refresh', { refreshToken })
          .then((res) => {
            setStoredTokens(res.data.accessToken, res.data.refreshToken);
            return res.data.accessToken as string;
          })
          .catch(() => {
            clearStoredTokens();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; details?: Array<{ message: string }> } | undefined;
    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      return `${data.error || 'Error'}: ${data.details.map((d) => d.message).join(' · ')}`;
    }
    if (data?.error) return data.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
