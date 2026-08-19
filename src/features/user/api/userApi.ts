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
  situacaoUsuario?: SituacaoUsuario;
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
  campoEclesiastico?: CampoEclesiastico;
  cargo: string;
  status: string;
  situacaoUsuario?: SituacaoUsuario;
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

export type SituacaoUsuario =
  | "APROVADO"
  | "PENDENTE"
  | "REANALISE"
  | "CORRECAO_SOLICITADA"
  | "REPROVADO";

export type StatusUsuario = "ATIVO" | "INATIVO";

export type UsuarioAnaliseItemRequest = {
  campo: CampoAnaliseUsuario;
  resultado: ResultadoAnaliseUsuario;
  observacao?: string;
};

export type UsuarioAnaliseRequest = {
  itens: UsuarioAnaliseItemRequest[];
};

export type UsuarioAnaliseResponse = {
  id: number;
  resultado: SituacaoUsuario;
  avaliadorEmail?: string;
  observacao?: string;
  criadoEm: string;
  itens: UsuarioAnaliseItemRequest[];
};

export type UsuarioAtualizarRequest = {
  nome?: string;
  cpf?: string;
  cargo?: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  campoEclesiastico?: {
    id: number;
  };
  foto?: string;
  fotoDocumento?: string;
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

export async function obterMinhaUltimaAnalise(
  signal?: AbortSignal
): Promise<UsuarioAnaliseResponse | null> {
  const response = await api.get<UsuarioAnaliseResponse>(
    "/usuario/minha-ultima-analise",
    {
      signal,
      validateStatus: (status) => status === 200 || status === 204,
    }
  );

  return response.status === 204 ? null : response.data;
}

export async function atualizarMeusDados(
  payload: UsuarioAtualizarRequest
): Promise<ObterInformacaoUsuarioResponse> {
  const response = await api.put<ObterInformacaoUsuarioResponse>(
    "/usuario/atualizar",
    payload
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
    status?: string;
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
        status: filters?.status || undefined,
        situacao: filters?.situacao || undefined,
      },
      signal,
    }
  );

  return response.data;
}

export async function listarMembros(
  page: number,
  size: number,
  filters?: {
    busca?: string;
    cargo?: string;
    status?: string;
    situacao?: string;
  },
  signal?: AbortSignal
): Promise<PageResponse<UsuarioResponse>> {
  const response = await api.get<PageResponse<UsuarioResponse>>(
    "/usuario/membros",
    {
      params: {
        page,
        size,
        busca: filters?.busca || undefined,
        cargo: filters?.cargo || undefined,
        status: filters?.status || undefined,
        situacao: filters?.situacao || undefined,
      },
      signal,
    }
  );

  return response.data;
}

export async function obterMembroPorId(
  id: number,
  signal?: AbortSignal
): Promise<UsuarioResponse> {
  const response = await api.get<UsuarioResponse>(`/usuario/membros/${id}`, {
    signal,
  });

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

export async function listarUsuariosVotantesPrivilegios(
  page: number,
  size: number,
  busca?: string,
  signal?: AbortSignal
): Promise<PageResponse<UsuarioResponse>> {
  const response = await api.get<PageResponse<UsuarioResponse>>(
    "/usuario/privilegios/votantes",
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
