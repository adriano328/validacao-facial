import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

const AUTH_FLOW_STORAGE_KEY = "evoto:auth-flow";

type StoredAuthFlow = {
  email: string | null;
};

type PessoaContextType = {
  email: string | null;
  setEmail: (email: string | null) => void;
  clearAuthFlow: () => void;
};

const AuthFlowContext = createContext<PessoaContextType | undefined>(undefined);

type AuthFlowProviderProps = {
  children: ReactNode;
};

const emptyAuthFlow: StoredAuthFlow = {
  email: null,
};

function readStoredAuthFlow(): StoredAuthFlow {
  try {
    const stored = window.sessionStorage.getItem(AUTH_FLOW_STORAGE_KEY);

    if (!stored) return emptyAuthFlow;

    return { ...emptyAuthFlow, ...JSON.parse(stored) };
  } catch {
    return emptyAuthFlow;
  }
}

function writeStoredAuthFlow(next: StoredAuthFlow) {
  try {
    window.sessionStorage.setItem(AUTH_FLOW_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Se o navegador bloquear storage, o contexto em memoria ainda funciona.
  }
}

function clearStoredAuthFlow() {
  try {
    window.sessionStorage.removeItem(AUTH_FLOW_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function AuthFlowProvider({ children }: AuthFlowProviderProps) {
  const [flow, setFlow] = useState<StoredAuthFlow>(() => readStoredAuthFlow());

  function updateAuthFlow(next: Partial<StoredAuthFlow>) {
    setFlow((current) => {
      const updated = { ...current, ...next };
      writeStoredAuthFlow(updated);
      return updated;
    });
  }

  function setEmail(email: string | null) {
    updateAuthFlow({ email });
  }

  function clearAuthFlow() {
    clearStoredAuthFlow();
    setFlow(emptyAuthFlow);
  }

  return (
    <AuthFlowContext.Provider
      value={{
        email: flow.email,
        setEmail,
        clearAuthFlow,
      }}
    >
      {children}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);

  if (!context) {
    throw new Error("useAuthFlow deve ser usado dentro de AuthFlowProvider");
  }

  return context;
}
