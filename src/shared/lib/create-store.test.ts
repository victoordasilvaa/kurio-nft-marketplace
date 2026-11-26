import { describe, expect, it, vi } from 'vitest';

import { createStore } from './create-store';

describe('createStore', () => {
  it('expõe o estado inicial', () => {
    expect(createStore({ count: 0 }).getState()).toEqual({ count: 0 });
  });

  it('notifica os assinantes quando o estado muda', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((state) => ({ count: state.count + 1 }));

    expect(store.getState()).toEqual({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('não notifica quando o atualizador devolve o mesmo estado', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.update((state) => state);

    expect(listener).not.toHaveBeenCalled();
  });

  it('para de notificar depois de cancelar a assinatura', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.update((state) => ({ count: state.count + 1 }));

    expect(listener).not.toHaveBeenCalled();
  });
});
