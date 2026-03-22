import { api } from '../../../api/api';
import type { LoginPayload } from '../model/auth.types';

export async function login(payload: LoginPayload, signal?: AbortSignal) {
  const response = await api.post('/usuario/login', payload, { signal });
  return response.data;
}