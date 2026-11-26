import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineRealtimeEvent, type RealtimeEnvelope } from '@/shared/realtime/contract';

import { isRecipient, parseEnvelope } from './delivery';

// catálogo usado só neste teste, para exercitar a validação sem depender dos eventos de domínio
const schemas = {
  'sample.updated': defineRealtimeEvent(
    'sample.updated',
    'sample',
    z.object({ value: z.number() }),
  ),
};

const validEnvelope: RealtimeEnvelope = {
  id: 'evt-1',
  type: 'sample.updated',
  resource: { type: 'sample', id: 'sample-1' },
  version: 2,
  occurredAt: '2026-11-25T12:00:00.000Z',
  audience: { scope: 'public' },
  data: { value: 10 },
};

describe('isRecipient', () => {
  it('entrega evento público para visitante e usuário', () => {
    expect(isRecipient(null, { scope: 'public' })).toBe(true);
    expect(isRecipient('user-1', { scope: 'public' })).toBe(true);
  });

  it('entrega evento privado só para o usuário de destino', () => {
    const audience = { scope: 'user', userId: 'user-1' } as const;
    expect(isRecipient('user-1', audience)).toBe(true);
    expect(isRecipient('user-2', audience)).toBe(false);
    expect(isRecipient(null, audience)).toBe(false);
  });
});

describe('parseEnvelope', () => {
  it('aceita evento registrado e dentro do schema', () => {
    expect(parseEnvelope(schemas, validEnvelope)).toEqual(validEnvelope);
  });

  it('recusa evento sem contrato registrado', () => {
    expect(() => parseEnvelope(schemas, { ...validEnvelope, type: 'other.updated' })).toThrow(
      /sem contrato registrado: other\.updated/,
    );
  });

  it('não confunde propriedades herdadas com eventos registrados', () => {
    expect(() => parseEnvelope(schemas, { ...validEnvelope, type: 'constructor' })).toThrow(
      /sem contrato registrado/,
    );
  });

  it('recusa payload fora do schema', () => {
    expect(() => parseEnvelope(schemas, { ...validEnvelope, data: { value: 'dez' } })).toThrow(
      /fora do contrato \(sample\.updated\)/,
    );
  });

  it('recusa versão inválida e data fora do formato ISO', () => {
    expect(() => parseEnvelope(schemas, { ...validEnvelope, version: 0 })).toThrow(/version/);
    expect(() => parseEnvelope(schemas, { ...validEnvelope, occurredAt: 'ontem' })).toThrow(
      /occurredAt/,
    );
  });
});
