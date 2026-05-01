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
  ultimoLogin: string;
  cpf: string;
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
