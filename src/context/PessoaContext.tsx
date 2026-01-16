import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type PessoaContextType = {
  pessoaId: number | null;
  email: string | null;
  senha: string | null,
  setPessoaId: (id: number | null) => void;
  setSenha: (senha: string | null) => void;
  setEmail: (email: string | null) => void;
  clearPessoa: () => void;
};

const PessoaContext = createContext<PessoaContextType | undefined>(undefined);

type PessoaProviderProps = {
  children: ReactNode;
};

export function PessoaProvider({ children }: PessoaProviderProps) {
  const [pessoaId, setPessoaId] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [senha, setSenha] = useState<string | null>(null);

  function clearPessoa() {
    setPessoaId(null);
    setEmail(null),
      setEmail(null);
  }

  return (
    <PessoaContext.Provider
      value={{
        pessoaId,
        senha,
        email,
        setPessoaId,
        setSenha,
        setEmail,
        clearPessoa,
      }}
    >
      {children}
    </PessoaContext.Provider>
  );
}

export function usePessoa() {
  const context = useContext(PessoaContext);

  if (!context) {
    throw new Error("usePessoa deve ser usado dentro de PessoaProvider");
  }

  return context;
}
