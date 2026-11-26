import { describe, expect, it } from 'vitest';

import { ENGINE_IO_PING, ENGINE_IO_PONG, encodeConnectError, readClientConnect } from './protocol';

describe('readClientConnect', () => {
  it('lê o CONNECT de visitante sem auth', () => {
    expect(readClientConnect('40')).toEqual({ auth: {} });
  });

  it('lê o CONNECT com objeto de auth vazio', () => {
    expect(readClientConnect('40{}')).toEqual({ auth: {} });
  });

  it('lê o token enviado no auth', () => {
    expect(readClientConnect('40{"token":"tok-1"}')).toEqual({ auth: { token: 'tok-1' } });
  });

  it('ignora CONNECT para outro namespace', () => {
    expect(readClientConnect('40/admin,{"token":"tok-1"}')).toBeNull();
  });

  it('ignora eventos, ping e pong', () => {
    expect(readClientConnect('42["client.hello",{}]')).toBeNull();
    expect(readClientConnect(ENGINE_IO_PING)).toBeNull();
    expect(readClientConnect(ENGINE_IO_PONG)).toBeNull();
  });

  it('ignora frames malformados', () => {
    expect(readClientConnect('40{token')).toBeNull();
    expect(readClientConnect('4x')).toBeNull();
  });
});

describe('encodeConnectError', () => {
  it('gera o pacote 44 com a mensagem', () => {
    expect(encodeConnectError('unauthorized')).toBe('44{"message":"unauthorized"}');
  });

  it('inclui dados adicionais quando informados', () => {
    expect(encodeConnectError('unauthorized', { code: 'session_expired' })).toBe(
      '44{"message":"unauthorized","data":{"code":"session_expired"}}',
    );
  });
});
