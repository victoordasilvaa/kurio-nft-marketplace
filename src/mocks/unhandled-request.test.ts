import { describe, expect, it } from 'vitest';

import {
  isSimulatedBackendRequest,
  simulatedBackendBases,
  unhandledRequestMessage,
} from './unhandled-request';

const ORIGIN = 'http://127.0.0.1:4310';

describe('isSimulatedBackendRequest', () => {
  const bases = simulatedBackendBases('/api', ORIGIN);

  it.each([
    ['/api', true],
    ['/api/health', true],
    ['/api/nfts?page=2', true],
    ['/__mock/state', true],
    ['/__mock', true],
    ['/apix/health', false],
    ['/__mockery', false],
    ['/assets/index-abc123.js', false],
    ['/mockServiceWorker.js', false],
    ['/', false],
  ])('base relativa /api: %s -> %s', (path, expected) => {
    expect(isSimulatedBackendRequest(new URL(path, ORIGIN), bases)).toBe(expected);
  });

  it('não confunde a mesma rota em outra origem', () => {
    expect(isSimulatedBackendRequest(new URL('https://cdn.kurio.dev/api/x'), bases)).toBe(false);
  });

  it('não trata a conexão de tempo real como chamada REST', () => {
    const socketUrl = new URL('wss://realtime.kurio.test/socket.io/?EIO=4&transport=websocket');
    expect(isSimulatedBackendRequest(socketUrl, bases)).toBe(false);
  });

  it('aceita base absoluta na raiz de outra origem', () => {
    const absolute = simulatedBackendBases('https://api.kurio.dev', ORIGIN);
    expect(isSimulatedBackendRequest(new URL('https://api.kurio.dev/nfts/1'), absolute)).toBe(true);
    expect(isSimulatedBackendRequest(new URL('/nfts/1', ORIGIN), absolute)).toBe(false);
    expect(isSimulatedBackendRequest(new URL('/__mock/state', ORIGIN), absolute)).toBe(true);
  });

  it('aceita base absoluta com caminho', () => {
    const versioned = simulatedBackendBases('https://api.kurio.dev/v1', ORIGIN);
    expect(isSimulatedBackendRequest(new URL('https://api.kurio.dev/v1/nfts'), versioned)).toBe(
      true,
    );
    expect(isSimulatedBackendRequest(new URL('https://api.kurio.dev/v2/nfts'), versioned)).toBe(
      false,
    );
  });
});

describe('unhandledRequestMessage', () => {
  it('cita método e caminho, sem a origem', () => {
    expect(unhandledRequestMessage('POST', new URL('/api/cart?x=1', ORIGIN))).toBe(
      'Requisição sem handler no backend simulado: POST /api/cart',
    );
  });
});
