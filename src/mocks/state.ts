import type { MockScenarioId } from './control/contract';

// Estado do backend simulado. Hoje guarda só o cenário ativo; as próximas fases acrescentam
// as tabelas (catálogo, usuários, sessões, carrinho, pedidos) e a persistência para refresh.
export interface MockBackendState {
  readonly scenario: MockScenarioId;
}

export interface MockBackendStore {
  getState: () => MockBackendState;
  // descarta todo o estado e recria o cenário a partir do zero
  reset: (scenario: MockScenarioId) => MockBackendState;
}

function createScenarioState(scenario: MockScenarioId): MockBackendState {
  return { scenario };
}

export function createMockBackendStore(initialScenario: MockScenarioId): MockBackendStore {
  let state = createScenarioState(initialScenario);
  return {
    getState: () => state,
    reset: (scenario) => {
      state = createScenarioState(scenario);
      return state;
    },
  };
}
