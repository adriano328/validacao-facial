import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  getAuthToken,
  setAuthToken as setApiAuthToken,
  clearAuthToken as clearApiAuthToken,
} from "../../api/api";

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
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());

  const setToken = (value: string | null) => {
    setTokenState(value);
    setApiAuthToken(value);
  };

  const clearToken = () => {
    setTokenState(null);
    clearApiAuthToken();
  };

  const value = useMemo(
    () => ({
      token,
      setToken,
      clearToken,
      isAuthenticated: Boolean(token),
    }),
    [token],
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