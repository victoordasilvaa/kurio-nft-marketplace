import { z } from 'zod';

const DEFAULT_API_BASE_URL = '/api';
const DEFAULT_REALTIME_URL = 'wss://realtime.kurio.test';

// aceita caminho na mesma origem (ex.: /api) ou URL http(s) absoluta, sempre sem barra final
function isApiBaseUrl(value: string): boolean {
  if (value.endsWith('/')) return false;
  if (value.startsWith('/')) return !value.startsWith('//') && !/\s/.test(value);
  if (!URL.canParse(value)) return false;
  const { protocol } = new URL(value);
  return protocol === 'http:' || protocol === 'https:';
}

const envSchema = z.object({
  VITE_ENABLE_MOCKS: z.enum(['true', 'false'], {
    error: "deve ser 'true' ou 'false'",
  }),
  VITE_API_BASE_URL: z
    .string({ error: 'deve ser um texto' })
    .refine(isApiBaseUrl, {
      error: 'deve ser um caminho absoluto (ex.: /api) ou uma URL http(s), sem barra final',
    })
    .default(DEFAULT_API_BASE_URL),
  VITE_REALTIME_URL: z
    .url({ protocol: /^wss?$/, error: 'deve ser uma URL ws:// ou wss://' })
    .default(DEFAULT_REALTIME_URL),
});

export interface AppEnv {
  enableMocks: boolean;
  apiBaseUrl: string;
  realtimeUrl: string;
}

// valida as variáveis expostas pelo Vite (import.meta.env) e falha listando todos os problemas
export function parseEnv(source: Readonly<Record<string, unknown>>): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `- ${issue.path.join('.') || '(raiz)'}: ${issue.message}`,
    );
    throw new Error(`Configuração de ambiente inválida:\n${problems.join('\n')}`);
  }
  return {
    enableMocks: result.data.VITE_ENABLE_MOCKS === 'true',
    apiBaseUrl: result.data.VITE_API_BASE_URL,
    realtimeUrl: result.data.VITE_REALTIME_URL,
  };
}

let cachedEnv: AppEnv | undefined;

// leitura preguiçosa: o erro de configuração acontece dentro do bootstrap, que o exibe na tela
export function getEnv(): AppEnv {
  cachedEnv ??= parseEnv(import.meta.env);
  return cachedEnv;
}
