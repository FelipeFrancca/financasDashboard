import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { dashboardService } from "../services/api";

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://localhost:5000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem("refreshToken")
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    if (accessToken) {
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to load user:", error);
      // Try to refresh token
      try {
        await refreshAccessToken();
      } catch (refreshError) {
        // If refresh fails, clear tokens
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

    setUser(user);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    // If there is a pending share code (user clicked a shared link before login), accept it now
    try {
      const pending = localStorage.getItem("pendingShareCode");
      if (pending) {
        await dashboardService.acceptInvite(pending);
        localStorage.removeItem("pendingShareCode");
      }
    } catch (err) {
      // non-blocking
      console.warn("Failed to accept pending share code:", err);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      name,
    });

    const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

    setUser(user);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    // Accept pending share if exists
    try {
      const pending = localStorage.getItem("pendingShareCode");
      if (pending) {
        await dashboardService.acceptInvite(pending);
        localStorage.removeItem("pendingShareCode");
      }
    } catch (err) {
      console.warn("Failed to accept pending share code:", err);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
      refreshToken,
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    // Reload user with new token
    await loadUser();
  };

  const setTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        register,
        logout,
        refreshAccessToken,
        setTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
