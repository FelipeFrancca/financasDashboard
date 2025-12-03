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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPasswordWithCode: (email: string, code: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use URL relativa quando VITE_API_URL não está definida (produção)
const API_URL = import.meta.env.VITE_API_URL === undefined || import.meta.env.VITE_API_URL === ''
  ? ''
  : import.meta.env.VITE_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [persistence, setPersistence] = useState<'local' | 'session'>('local');

  // Load user on mount if token exists
  useEffect(() => {
    const localAccess = localStorage.getItem("accessToken");
    const localRefresh = localStorage.getItem("refreshToken");
    const sessionAccess = sessionStorage.getItem("accessToken");
    const sessionRefresh = sessionStorage.getItem("refreshToken");

    if (localAccess && localRefresh) {
      setAccessToken(localAccess);
      setRefreshToken(localRefresh);
      setPersistence('local');
      loadUser(localAccess);
    } else if (sessionAccess && sessionRefresh) {
      setAccessToken(sessionAccess);
      setRefreshToken(sessionRefresh);
      setPersistence('session');
      loadUser(sessionAccess);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Backend returns { success: true, data: { user, ... } }
      setUser(response.data.data || response.data.user);
    } catch (error) {
      console.error("Failed to load user:", error);
      // If token is invalid, clear everything without trying to refresh
      // This prevents infinite loops when refresh token is also invalid
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

      setUser(user);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      const storage = rememberMe ? localStorage : sessionStorage;
      const type = rememberMe ? 'local' : 'session';
      setPersistence(type);

      // Clear other storage to avoid confusion
      if (rememberMe) {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }

      storage.setItem("accessToken", newAccessToken);
      storage.setItem("refreshToken", newRefreshToken);

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
    } catch (error: any) {
      // Preserve error code from backend for detailed error handling
      const errorCode = error.response?.data?.error?.code;
      const errorMessage = error.response?.data?.error?.message || error.message;

      const authError: any = new Error(errorMessage);
      authError.code = errorCode;

      throw authError;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      name,
    });

    const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;

    setUser(user);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setPersistence('local'); // Default to local for register

    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

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
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  };

  const refreshAccessToken = async () => {
    const currentRefresh = persistence === 'local'
      ? localStorage.getItem("refreshToken")
      : sessionStorage.getItem("refreshToken");

    if (!currentRefresh) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${API_URL}/api/auth/refresh`, {
      refreshToken: currentRefresh,
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);

    const storage = persistence === 'local' ? localStorage : sessionStorage;
    storage.setItem("accessToken", newAccessToken);
    storage.setItem("refreshToken", newRefreshToken);

    // Reload user with new token
    // Note: loadUser calls refreshAccessToken on error, so we need to be careful not to loop infinitely.
    // Here we just update the state.
  };

  const setTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);

    // Default to local if not set (e.g. from external call)
    const storage = persistence === 'session' ? sessionStorage : localStorage;
    storage.setItem("accessToken", access);
    storage.setItem("refreshToken", refresh);

    loadUser(access);
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Erro ao solicitar redefinição de senha";
      throw new Error(message);
    }
  };

  const resetPasswordWithCode = async (email: string, code: string, password: string) => {
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { email, code, password });
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Erro ao redefinir senha";
      throw new Error(message);
    }
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
        requestPasswordReset,
        resetPasswordWithCode,
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
