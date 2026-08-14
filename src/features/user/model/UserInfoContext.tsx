import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const recarregarPromiseRef = useRef<Promise<void> | null>(null);

  const limparUsuario = useCallback(() => {
    setUsuario(null);
    setError(null);
    setLoading(false);
    recarregarPromiseRef.current = null;
  }, []);

  const recarregarUsuario = useCallback(async () => {
    if (!token) {
      limparUsuario();
      return;
    }

    if (recarregarPromiseRef.current) {
      return recarregarPromiseRef.current;
    }

    const controller = new AbortController();
    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await obterInformacaoUsuario(controller.signal);
        setUsuario(data);
      } catch {
        setUsuario(null);
        setError("Nao foi possivel carregar as informacoes do usuario.");
      } finally {
        setLoading(false);
        recarregarPromiseRef.current = null;
      }
    })();

    recarregarPromiseRef.current = promise;
    return promise;
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
