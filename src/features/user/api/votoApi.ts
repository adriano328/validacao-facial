import { api } from "@shared/api/client";

export type CedulaVotacaoResponse = {
  cedulaId: string;
};

export type CargoVotadoPayload = {
  cargoId: number;
  voto: number;
};

export type RegistrarVotoPayload = {
  cedulaId: string;
  cargosVotados: CargoVotadoPayload[];
};

export type VotoRegistradoResponse = {
  mensagem: string;
  eleicaoId: number;
  dataVotacao: string;
  chaveVerificacao: string;
};

export async function criarCedulaVotacao(
  eleicaoId: number
): Promise<CedulaVotacaoResponse> {
  const response = await api.post<CedulaVotacaoResponse>("/votos/cedulas", null, {
    params: { eleicaoId },
  });

  return response.data;
}

export async function registrarVoto(
  payload: RegistrarVotoPayload
): Promise<VotoRegistradoResponse> {
  const response = await api.post<VotoRegistradoResponse>("/votos", payload);

  return response.data;
}
