import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthToken } from "@features/auth/model/AuthTokenContext";
import {
  obterInformacaoUsuario,
  type ObterInformacaoUsuarioResponse,
} from "@features/user/api/userApi";

type UserInfoContextData = {
  usuario: ObterInformacaoUsuarioResponse | null;
  loading: boolean;
  error: string | null;
  recarregarUsuario: () => Promise<void>;
  limparUsuario: () => void;
};

const UserInfoContext = createContext<UserInfoContextData | undefined>(
  undefined
);

type UserInfoProviderProps = {
  children: ReactNode;
};

export function UserInfoProvider({ children }: UserInfoProviderProps) {
  const { token } = useAuthToken();

  const [usuario, setUsuario] =
    useState<ObterInformacaoUsuarioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limparUsuario = useCallback(() => {
    setUsuario(null);
    setError(null);
    setLoading(false);
  }, []);

  const recarregarUsuario = useCallback(async () => {
    if (!token) {
      limparUsuario();
      return;
    }

    const controller = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const data = await obterInformacaoUsuario(controller.signal);
      setUsuario(data);
    } catch {
      setUsuario(null);
      setError("Não foi possível carregar as informações do usuário.");
    } finally {
      setLoading(false);
    }
  }, [token, limparUsuario]);

  useEffect(() => {
    if (!token) {
      limparUsuario();
      return;
    }

    void recarregarUsuario();
  }, [token, recarregarUsuario, limparUsuario]);

  const value = useMemo<UserInfoContextData>(
    () => ({
      usuario,
      loading,
      error,
      recarregarUsuario,
      limparUsuario,
    }),
    [usuario, loading, error, recarregarUsuario, limparUsuario]
  );

  return (
    <UserInfoContext.Provider value={value}>
      {children}
    </UserInfoContext.Provider>
  );
}

export function useUserInfo() {
  const context = useContext(UserInfoContext);

  if (!context) {
    throw new Error("useUserInfo deve ser usado dentro de UserInfoProvider.");
  }

  return context;
}
