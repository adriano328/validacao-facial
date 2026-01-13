import { api } from "../api/api";
import type { Pessoa } from "../features/cadastro/types";

export async function salvarPessoa(payload: Pessoa, signal?: AbortSignal) {
    const { data } = await api.post('/pessoa/salvar', payload, { signal });
    return data;
}