import { api } from "@shared/api/client";
import type { TipoUsuario } from "@features/user/model/permissions";

export type CampoEclesiastico = {
  id: number;
  nomeCampo: string;
};

export type ObterInformacaoUsuarioResponse = {
  id: number;
  nome: string;
  cargo: string;
  telefone: string;
  dataNascimento: string;
  campoEclesiastico: CampoEclesiastico;
  campoEclesiasticoId?: number;
  ultimoLogin: string;
  email?: string;
  cpf: string;
  status?: string;
  situacaoUsuario?: string;
  tipoUsuario?: TipoUsuario | number | string;
  foto?: string;
  fotoDocumento?: string;
};

export type UsuarioResponse = {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  campoEclesiasticoId: number;
  cargo: string;
  status: string;
  situacaoUsuario?: string;
  tipoUsuario: TipoUsuario | number | string;
  foto: string;
  fotoDocumento: string;
};

export type CampoAnaliseUsuario =
  | "FOTO"
  | "NOME"
  | "CPF"
  | "DATA_NASCIMENTO"
  | "FOTO_DOCUMENTO";

export type ResultadoAnaliseUsuario = "APROVADO" | "REPROVADO";

export type UsuarioAnaliseItemRequest = {
  campo: CampoAnaliseUsuario;
  resultado: ResultadoAnaliseUsuario;
  observacao?: string;
};

export type UsuarioAnaliseRequest = {
  itens: UsuarioAnaliseItemRequest[];
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export async function obterInformacaoUsuario(
  signal?: AbortSignal
): Promise<ObterInformacaoUsuarioResponse> {
  const response = await api.get<ObterInformacaoUsuarioResponse>(
    "/usuario/obter-informacao-usuario",
    { signal }
  );

  return response.data;
}

export async function obterUsuarioPorId(
  id: number,
  signal?: AbortSignal
): Promise<UsuarioResponse> {
  const response = await api.get<UsuarioResponse>(`/usuario/${id}`, { signal });

  return response.data;
}

export async function listarUsuarios(
  page: number,
  size: number,
  signal?: AbortSignal
): Promise<PageResponse<UsuarioResponse>> {
  const response = await api.get<PageResponse<UsuarioResponse>>(
    "/usuario/listar",
    {
      params: { page, size },
      signal,
    }
  );

  return response.data;
}

export async function listarUsuariosPendentes(
  page: number,
  size: number,
  filters?: {
    busca?: string;
    cargo?: string;
    situacao?: string;
  },
  signal?: AbortSignal
): Promise<PageResponse<UsuarioResponse>> {
  const response = await api.get<PageResponse<UsuarioResponse>>(
    "/usuario/pendentes",
    {
      params: {
        page,
        size,
        busca: filters?.busca || undefined,
        cargo: filters?.cargo || undefined,
        situacao: filters?.situacao || undefined,
      },
      signal,
    }
  );

  return response.data;
}

export async function listarUsuariosPrivilegios(
  page: number,
  size: number,
  busca?: string,
  signal?: AbortSignal
): Promise<PageResponse<UsuarioResponse>> {
  const response = await api.get<PageResponse<UsuarioResponse>>(
    "/usuario/privilegios",
    {
      params: {
        page,
        size,
        busca: busca || undefined,
      },
      signal,
    }
  );

  return response.data;
}

export async function listarUsuariosInativos(
  page: number,
  size: number,
  signal?: AbortSignal
): Promise<PageResponse<UsuarioResponse>> {
  const response = await api.get<PageResponse<UsuarioResponse>>(
    "/usuario/inativos",
    {
      params: { page, size },
      signal,
    }
  );

  return response.data;
}

export async function confirmarUsuarioPorCpf(
  cpf: string,
  signal?: AbortSignal
): Promise<void> {
  await api.put(
    "/usuario/confirmar-usuario",
    { cpf },
    { signal }
  );
}

export async function aprovarUsuario(
  id: number,
  analise: UsuarioAnaliseRequest
): Promise<UsuarioResponse> {
  const response = await api.put<UsuarioResponse>(
    `/usuario/${id}/aprovar`,
    analise
  );

  return response.data;
}

export async function solicitarCorrecaoUsuario(
  id: number,
  analise: UsuarioAnaliseRequest
): Promise<UsuarioResponse> {
  const response = await api.put<UsuarioResponse>(
    `/usuario/${id}/solicitar-correcao`,
    analise
  );

  return response.data;
}

export async function reprovarUsuario(
  id: number,
  analise: UsuarioAnaliseRequest
): Promise<UsuarioResponse> {
  const response = await api.put<UsuarioResponse>(
    `/usuario/${id}/reprovar`,
    analise
  );

  return response.data;
}

export async function alterarTipoUsuario(
  usuarioId: number,
  tipoUsuario: TipoUsuario
): Promise<UsuarioResponse> {
  const response = await api.put<UsuarioResponse>(
    "/usuario/alterar-tipo",
    {
      usuarioId,
      tipoUsuario,
    }
  );

  return response.data;
}
