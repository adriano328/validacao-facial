import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearAuthToken, setAuthToken, setUnauthorizedHandler } from "../api/api";

type AuthTokenContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
  isAuthenticated: boolean;
};

const AuthTokenContext = createContext<AuthTokenContextType | null>(null);

type AuthTokenProviderProps = {
  children: React.ReactNode;
};

export function AuthTokenProvider({ children }: AuthTokenProviderProps) {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = useCallback((value: string | null) => {
    setTokenState(value);
  }, []);

  const clearToken = useCallback(() => {
    setTokenState(null);
    clearAuthToken();
  }, []);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => clearToken());

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [clearToken]);

  const value = useMemo<AuthTokenContextType>(
    () => ({
      token,
      setToken,
      clearToken,
      isAuthenticated: Boolean(token),
    }),
    [token, setToken, clearToken],
  );

  return (
    <AuthTokenContext.Provider value={value}>
      {children}
    </AuthTokenContext.Provider>
  );
}

export function useAuthToken() {
  const context = useContext(AuthTokenContext);

  if (!context) {
    throw new Error("useAuthToken must be used within AuthTokenProvider");
  }

  return context;
}