// store externo mínimo, compatível com useSyncExternalStore
// (funções como propriedades: podem ser passadas sem bind)
export interface Store<TState> {
  getState: () => TState;
  subscribe: (listener: () => void) => () => void;
  update: (updater: (state: TState) => TState) => void;
}

export function createStore<TState>(initialState: TState): Store<TState> {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (updater) => {
      const next = updater(state);
      if (Object.is(next, state)) return;
      state = next;
      for (const listener of [...listeners]) {
        listener();
      }
    },
  };
}
