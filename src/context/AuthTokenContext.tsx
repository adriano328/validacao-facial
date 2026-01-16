import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthTokenContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
  clearToken: () => void;
  isAuthenticated: boolean;
};

const AuthTokenContext = createContext<AuthTokenContextType | null>(null);

const STORAGE_KEY = "token-valid-person";

export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTokenState(stored);
    } catch {
      // ignore
    }
  }, []);

  // 🔹 Persiste token
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [token]);

  const setToken = (value: string | null) => {
    setTokenState(value);
  };

  const clearToken = () => {
    setTokenState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
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
  const ctx = useContext(AuthTokenContext);
  if (!ctx) {
    throw new Error("useAuthToken must be used within AuthTokenProvider");
  }
  return ctx;
}
