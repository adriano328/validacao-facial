import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type PessoaContextType = {
  pessoaId: number | null;
  email: string | null;
  senha: string | null;
  setPessoaId: (id: number | null) => void;
  setSenha: (senha: string | null) => void;
  setEmail: (email: string | null) => void;
  clearAuthFlow: () => void;
};

const AuthFlowContext = createContext<PessoaContextType | undefined>(undefined);

type AuthFlowProviderProps = {
  children: ReactNode;
};

export function AuthFlowProvider({ children }: AuthFlowProviderProps) {
  const [pessoaId, setPessoaId] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [senha, setSenha] = useState<string | null>(null);

  function clearAuthFlow() {
    setPessoaId(null);
    setEmail(null);
    setSenha(null);
  }

  return (
    <AuthFlowContext.Provider
      value={{
        pessoaId,
        senha,
        email,
        setPessoaId,
        setSenha,
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
