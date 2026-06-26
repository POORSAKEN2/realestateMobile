import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "./client";

const AUTH_STORAGE_KEY = "realestate.auth.session";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      let sessionStr = null;
      if (await SecureStore.isAvailableAsync()) {
        sessionStr = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
      } else if (typeof localStorage !== "undefined") {
        sessionStr = localStorage.getItem(AUTH_STORAGE_KEY);
      }

      if (sessionStr) {
        let token = sessionStr;
        try {
          const session = JSON.parse(sessionStr);
          if (session?.accessToken) {
            token = session.accessToken;
          }
        } catch {
          // If it's not JSON, it's just the raw token string
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching auth token in interceptor", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Response interceptor for handling 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // You can trigger a global logout event or token refresh here
    }
    return Promise.reject(error);
  }
);
