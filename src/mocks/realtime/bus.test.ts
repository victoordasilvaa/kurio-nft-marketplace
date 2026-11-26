import { describe, expect, it, vi } from 'vitest';

import type { RealtimeEnvelope } from '@/shared/realtime/contract';

import { createRealtimeBus } from './bus';

const envelope: RealtimeEnvelope = {
  id: 'evt-1',
  type: 'sample.updated',
  resource: { type: 'sample', id: 'sample-1' },
  version: 1,
  occurredAt: '2026-11-25T12:00:00.000Z',
  audience: { scope: 'public' },
  data: null,
};

describe('createRealtimeBus', () => {
  it('entrega o evento publicado a todos os assinantes, na ordem de inscrição', () => {
    const bus = createRealtimeBus<RealtimeEnvelope>();
    const calls: string[] = [];
    bus.subscribe((event) => calls.push(`a:${event.id}`));
    bus.subscribe((event) => calls.push(`b:${event.id}`));

    bus.publish(envelope);

    expect(calls).toEqual(['a:evt-1', 'b:evt-1']);
  });

  it('para de entregar depois de cancelar a assinatura', () => {
    const bus = createRealtimeBus<RealtimeEnvelope>();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);

    unsubscribe();
    bus.publish(envelope);

    expect(listener).not.toHaveBeenCalled();
  });

  it('propaga a falha do assinante para quem publicou', () => {
    const bus = createRealtimeBus<RealtimeEnvelope>();
    bus.subscribe(() => {
      throw new Error('evento inválido');
    });

    expect(() => bus.publish(envelope)).toThrow('evento inválido');
  });
});
