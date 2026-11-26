import { getEnv } from '@/shared/config/env';

// caminho completo de um recurso REST na base configurada (VITE_API_BASE_URL)
export function apiUrl(path: `/${string}`): string {
  return `${getEnv().apiBaseUrl}${path}`;
}
