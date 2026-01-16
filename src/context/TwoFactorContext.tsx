// src/context/TwoFactorContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type TwoFactorStatus = "inactive" | "active";

type TwoFactorContextType = {
  secret: string | null;
  status: TwoFactorStatus;

  setSecret: (secret: string | null) => void;
  clearSecret: () => void;
  setActive: () => void;
  resetTwoFactor: () => void;
};

const TwoFactorContext = createContext<TwoFactorContextType | undefined>(
  undefined
);

type TwoFactorProviderProps = {
  children: ReactNode;
};

export function TwoFactorProvider({ children }: TwoFactorProviderProps) {
  const [secret, setSecretState] = useState<string | null>(null);
  const [status, setStatus] = useState<TwoFactorStatus>("inactive");

  function setSecret(secret: string | null) {
    setSecretState(secret);
  }

  function clearSecret() {
    setSecretState(null);
  }

  function setActive() {
    setSecretState(null);
    setStatus("active");
  }

  function resetTwoFactor() {
    setSecretState(null);
    setStatus("inactive");
  }

  return (
    <TwoFactorContext.Provider
      value={{
        secret,
        status,
        setSecret,
        clearSecret,
        setActive,
        resetTwoFactor,
      }}
    >
      {children}
    </TwoFactorContext.Provider>
  );
}

export function useTwoFactor() {
  const context = useContext(TwoFactorContext);
  if (!context) {
    throw new Error("useTwoFactor deve ser usado dentro de TwoFactorProvider");
  }
  return context;
}
