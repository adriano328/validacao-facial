import { api } from "@shared/api/client";

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
  tipoUsuario?: number;
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
  tipoUsuario: number;
  foto: string;
  fotoDocumento: string;
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
