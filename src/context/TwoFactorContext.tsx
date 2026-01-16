import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type TwoFactorContextType = {
  secret: string | null;
  setSecret: (secret: string | null) => void;
  clearSecret: () => void;
};

const TwoFactorContext = createContext<TwoFactorContextType | undefined>(
  undefined
);

type TwoFactorProviderProps = {
  children: ReactNode;
};

export function TwoFactorProvider({ children }: TwoFactorProviderProps) {
  const [secret, setSecretState] = useState<string | null>(null);

  function setSecret(secret: string | null) {
    setSecretState(secret);
  }

  function clearSecret() {
    setSecretState(null);
  }

  return (
    <TwoFactorContext.Provider
      value={{
        secret,
        setSecret,
        clearSecret,
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
