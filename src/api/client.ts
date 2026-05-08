import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8000/api/v1";
const IDEMPOTENCY_KEY_HEADER = "X-Idempotency-Key";
export const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
export const AUTH_EXPIRED_EVENT = "kds-auth-expired";

export function clearKdsAuthSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

const coreInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const aiInstance: AxiosInstance = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for core API
coreInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = config.method?.toLowerCase();
    if ((method === "put" || method === "post") && !config.headers[IDEMPOTENCY_KEY_HEADER]) {
      config.headers[IDEMPOTENCY_KEY_HEADER] = crypto.randomUUID();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for core API
// NOTE: Only 401 (Unauthorized / token expired) should trigger logout.
// 403 (Forbidden) means the current role lacks permission for that endpoint —
// e.g. KITCHEN role cannot access /orders or /menu. This is expected and should NOT log out.
coreInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearKdsAuthSession();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export { coreInstance, aiInstance };
