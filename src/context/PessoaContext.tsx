
// src/contexts/PessoaContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type PessoaContextType = {
  pessoaId: number | null;
  setPessoaId: (id: number) => void;
};

const PessoaContext = createContext<PessoaContextType | undefined>(undefined);

export function PessoaProvider({ children }: { children: ReactNode }) {
  const [pessoaId, setPessoaId] = useState<number | null>(null);

  return (
    <PessoaContext.Provider value={{ pessoaId, setPessoaId }}>
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
