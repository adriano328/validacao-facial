import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
} from "../api/api";

type AuthTokenContextData = {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  clearToken: () => void;
};

const AuthTokenContext = createContext<AuthTokenContextData | undefined>(
  undefined
);

type AuthTokenProviderProps = {
  children: ReactNode;
};

const AUTH_TOKEN_STORAGE_KEY = "authToken";

export function AuthTokenProvider({ children }: AuthTokenProviderProps) {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    function handleUnauthorized() {
      setTokenState(null);
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      clearAuthToken();
    }

    setUnauthorizedHandler(handleUnauthorized);

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  function setToken(tokenValue: string | null) {
    setTokenState(tokenValue);

    if (tokenValue) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, tokenValue);
      setAuthToken(tokenValue);
      return;
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    clearAuthToken();
  }

  function clearToken() {
    setTokenState(null);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    clearAuthToken();
  }

  const value = useMemo<AuthTokenContextData>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      setToken,
      clearToken,
    }),
    [token]
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
    throw new Error("useAuthToken deve ser usado dentro de AuthTokenProvider.");
  }

  return context;
}