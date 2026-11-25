import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('aplica os padrões quando só a flag de mocks é informada', () => {
    expect(parseEnv({ VITE_ENABLE_MOCKS: 'true' })).toEqual({
      enableMocks: true,
      apiBaseUrl: '/api',
      realtimeUrl: 'wss://realtime.kurio.test',
    });
  });

  it('desliga os mocks com o valor false', () => {
    expect(parseEnv({ VITE_ENABLE_MOCKS: 'false' }).enableMocks).toBe(false);
  });

  it('aceita URLs explícitas de API e de tempo real', () => {
    expect(
      parseEnv({
        VITE_ENABLE_MOCKS: 'false',
        VITE_API_BASE_URL: 'https://api.kurio.test/v1',
        VITE_REALTIME_URL: 'ws://localhost:4000',
      }),
    ).toEqual({
      enableMocks: false,
      apiBaseUrl: 'https://api.kurio.test/v1',
      realtimeUrl: 'ws://localhost:4000',
    });
  });

  it('exige a flag de mocks', () => {
    expect(() => parseEnv({})).toThrow(/VITE_ENABLE_MOCKS: deve ser 'true' ou 'false'/);
  });

  it('rejeita valores de flag fora do contrato', () => {
    expect(() => parseEnv({ VITE_ENABLE_MOCKS: '1' })).toThrow(/VITE_ENABLE_MOCKS/);
  });

  it.each(['api', '/api/', '//cdn.kurio.test', 'ftp://api.kurio.test', ''])(
    'rejeita a base de API %j',
    (value) => {
      expect(() => parseEnv({ VITE_ENABLE_MOCKS: 'true', VITE_API_BASE_URL: value })).toThrow(
        /VITE_API_BASE_URL: deve ser um caminho absoluto/,
      );
    },
  );

  it('rejeita URL de tempo real que não seja WebSocket', () => {
    expect(() =>
      parseEnv({ VITE_ENABLE_MOCKS: 'true', VITE_REALTIME_URL: 'https://realtime.kurio.test' }),
    ).toThrow(/VITE_REALTIME_URL: deve ser uma URL ws:\/\/ ou wss:\/\//);
  });

  it('lista todos os problemas de uma vez', () => {
    expect(() => parseEnv({ VITE_ENABLE_MOCKS: 'sim', VITE_REALTIME_URL: 'http://x' })).toThrow(
      /VITE_ENABLE_MOCKS[\s\S]*VITE_REALTIME_URL/,
    );
  });
});
