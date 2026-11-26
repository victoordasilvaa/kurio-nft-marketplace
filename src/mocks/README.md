# src/mocks

Backend simulado com MSW, carregado só quando `VITE_ENABLE_MOCKS=true` e sempre antes do app (ver
`src/main.tsx`). O app nunca importa esta pasta: os dados chegam pelo Axios e pelo
`socket.io-client`, interceptados na camada de rede.

| Arquivo                | Papel                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `browser.ts`           | `setupWorker` e `startMockServiceWorker()`                         |
| `runtime.ts`           | Instâncias do backend (estado, barramento, servidor de tempo real) |
| `state.ts`             | Estado do backend; hoje só o cenário ativo                         |
| `handlers/index.ts`    | Agrega todos os handlers                                           |
| `handlers/health.ts`   | `GET {API}/health`                                                 |
| `handlers/control.ts`  | `GET /__mock/state` e `POST /__mock/reset`                         |
| `control/contract.ts`  | Contrato zod da API de controle (também usado pelos testes E2E)    |
| `realtime/server.ts`   | Servidor Socket.IO: `ws.link` + binding, conexões, heartbeat, auth |
| `realtime/bus.ts`      | Barramento tipado: handlers publicam, o servidor entrega           |
| `realtime/delivery.ts` | Entrega por audiência e validação do evento pelo catálogo          |
| `realtime/protocol.ts` | Frames brutos do Engine.IO/Socket.IO que o binding não expõe       |

Para acrescentar:

- um recurso REST: crie `handlers/<recurso>.ts` usando `apiUrl()` e registre em `handlers/index.ts`;
- um evento de tempo real: defina o schema com `defineRealtimeEvent` em
  `src/shared/realtime/events.ts` e publique pelo `realtimeBus` depois de alterar o estado; evento
  fora do catálogo ou fora do schema lança erro.

Regras: pode importar `src/shared` (contratos e configuração); não importa interface (`app`,
`routes`, `features`, `components`, `lib`), `axios` nem `socket.io-client`. De `src/shared/realtime`,
só `contract` e `events`: o cliente (`socket.ts` e o provider) avaliaria o `engine.io-client` antes
do `worker.start()`. Nunca use `delay()` sem argumento (é aleatório): latências precisam ser
determinísticas.
