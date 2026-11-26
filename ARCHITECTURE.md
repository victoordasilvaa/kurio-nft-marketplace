# Arquitetura

Documento vivo. Esta versão registra as decisões da fundação; as seções marcadas como pendentes são
preenchidas pelas fases seguintes.

## Camadas e fronteiras

| Pasta                 | Responsabilidade                                                     | Não pode importar                                                                                            |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/main.tsx`        | Inicialização: ambiente, mocks e carregamento do app                 | de forma estática, tudo além de `src/shared/config` e `src/styles`; socket.io-client, axios, msw             |
| `src/app`             | Composição: router, query client, providers, bootstrap, casca        | `src/mocks`, socket.io-client, axios, msw                                                                    |
| `src/routes`          | Rotas de arquivo: ligam caminho, validação de busca, loader e página | `src/mocks`, socket.io-client, axios, msw                                                                    |
| `src/features/*`      | Interface e regras de cada funcionalidade                            | `src/app`, `src/routes`, `src/mocks`, clientes de rede                                                       |
| `src/shared/api`      | Único ponto de uso do axios (cliente HTTP e contratos REST)          | `src/app`, `src/routes`, `src/features`, `src/mocks`                                                         |
| `src/shared/realtime` | Único ponto de uso do socket.io-client                               | `src/app`, `src/routes`, `src/features`, `src/mocks`                                                         |
| `src/shared/*`        | Configuração, utilitários, domínio puro e componentes compartilhados | `src/app`, `src/routes`, `src/features`, `src/mocks`                                                         |
| `src/components/ui`   | Componentes do shadcn/ui                                             | `src/app`, `src/routes`, `src/features`, `src/mocks`                                                         |
| `src/mocks`           | Backend simulado (MSW): REST, controle e Socket.IO                   | interface (`app`, `routes`, `features`, `components`, `lib`), socket.io-client, axios, cliente de tempo real |
| `e2e`                 | Testes Playwright                                                    | socket.io-client, axios, msw                                                                                 |

As regras estão em `eslint.config.js` (`kurio/boundaries/*`). Cada fronteira é uma expressão regular
sobre o especificador e vale:

- para import estático (inclusive `import type` e reexportação) e para import dinâmico;
- pelo alias (`@/app`) e pelo caminho relativo que sobe de pasta (`../../app`). Por isso, pastas
  internas de uma camada não usam os nomes das camadas (`app`, `routes`, `features`, `components`,
  `lib`, `mocks`).

Detalhes das regras:

- Import dinâmico só aceita string literal. Template literal, concatenação e `import.meta.glob` são
  barrados, porque a fronteira só pode ser verificada num especificador conhecido.
- A regra da entrada é a única que vale só para import estático, porque `src/main.tsx` carrega mocks
  e app por import dinâmico (ver Inicialização).
- O cliente de tempo real, que o backend simulado não importa, é tudo de `src/shared/realtime`
  exceto `contract` e `events`.

`tooling/eslint-boundaries.test.ts` verifica cada região com trechos de código permitidos e
proibidos. Uma mudança no `eslint.config.js` que abra uma fronteira faz o `npm test` falhar.

Comentários `eslint-disable` não têm efeito (`noInlineConfig`), `@ts-ignore`, `@ts-expect-error` e
`any` são proibidos. O `src/routeTree.gen.ts` é gerado pelo plugin do TanStack Router, versionado (o
`tsc` precisa dele num checkout limpo) e fica fora do lint e do Prettier.

## Inicialização

`src/main.tsx`:

1. valida o ambiente (`getEnv`);
2. se `VITE_ENABLE_MOCKS=true`, importa `src/mocks/browser` de forma dinâmica e aguarda
   `worker.start()`;
3. só então importa `src/app/bootstrap` de forma dinâmica e renderiza.

A ordem é obrigatória: o `engine.io-client` guarda `globalThis.WebSocket` quando o módulo é
avaliado, e o MSW só troca o WebSocket global dentro de `worker.start()`. Um import estático do app
(ou do socket.io-client) em `main.tsx` deixaria o tempo real fora do mock. Isso foi comprovado com
um controle negativo: com o import estático, a conexão vai para a rede
(`ERR_NAME_NOT_RESOLVED`) e o smoke E2E de tempo real falha. No build, o transporte WebSocket do
cliente fica só no chunk do bootstrap; o chunk de entrada não contém MSW nem socket.io-client.

A ordem é protegida de duas formas:

- lint: `src/main.tsx` só importa de forma estática `src/shared/config` e `src/styles`, e
  `src/mocks` não importa o cliente de tempo real, que avaliaria o `engine.io-client` antes do
  `worker.start()`;
- smoke E2E de tempo real: cobre também o caminho transitivo, que o lint não enxerga.

Falha na inicialização (ambiente inválido, erro ao registrar o service worker) aparece na página
num `role="alert"` e no console; não há modo degradado silencioso.

## Configuração

`src/shared/config/env.ts` valida `import.meta.env` com zod e expõe `{ enableMocks, apiBaseUrl,
realtimeUrl }`. Valores e precedência estão no `README.md` e no `.env.example`. Com mocks
desligados por variável de processo, o chunk de mocks continua no build, mas não é carregado.

## Backend simulado (MSW)

- `src/mocks/browser.ts`: `setupWorker` com todos os handlers; o worker é registrado por caminho
  absoluto (`/mockServiceWorker.js`), então funciona em qualquer rota profunda. Requisições sem
  handler: assets estáticos seguem para a rede sem aviso; chamadas para a base da API ou para
  `/__mock/*` geram aviso no console. `quiet` em produção.
- `src/mocks/handlers/`: `GET {API}/health` e a API de controle.
- `src/mocks/control/contract.ts`: contrato zod da API de controle (estado, reset e erro), também
  usado pelos testes E2E.
- `src/mocks/state.ts`: estado do backend simulado. Hoje guarda só o cenário ativo (`default`).
  `POST /__mock/reset` recria o estado do cenário; ainda não derruba conexões de tempo real.
- `src/mocks/runtime.ts`: instâncias do backend (estado, barramento e servidor de tempo real), uma
  por aba.

Pendente: banco tipado com transações, persistência local para refresh, cenários determinísticos
(latência, falhas, sessão expirada, conflitos, pagamento), fixtures e usuários fictícios.

## Tempo real

### Cliente (`src/shared/realtime`)

- `socket.ts`: `io(VITE_REALTIME_URL, { transports: ['websocket'], autoConnect: false,
forceNew: true, auth: (send) => send(getAuth()) })`. O `auth` é reavaliado a cada conexão. O
  bootstrap abre a conexão como visitante ao iniciar o app.
- O estado da conexão (`idle`, `connecting`, `connected`, `reconnecting`, `disconnected`, motivo
  da última queda, último erro e número de conexões) fica num store externo, lido por
  `useRealtimeConnectionState` (`useSyncExternalStore`). A partir da segunda conexão, os recursos
  ativos devem ser reconciliados com a API REST (não há recuperação de estado no transporte).
- `contract.ts`: schema do `auth` do CONNECT, audiência (`public` ou `user`) e o envelope comum dos
  eventos (`id`, `type`, `resource`, `version`, `occurredAt`, `audience`, `data`), criado por
  `defineRealtimeEvent`.
- `events.ts`: catálogo dos eventos servidor -> cliente. Ainda vazio: `nft.updated` e
  `order.updated` entram com os contratos de domínio.

### Servidor simulado (`src/mocks/realtime`)

- `server.ts`: `ws.link(VITE_REALTIME_URL)` + `toSocketIo` do `@mswjs/socket.io-binding`, registro
  de conexões (`pending`, `accepted`, `rejected`, com `userId`), ping do Engine.IO (`2`) a cada
  20 s com limpeza no `close`, leitura do `auth` no frame CONNECT bruto (`socket.io-parser`) e
  CONNECT_ERROR (`44`) para auth inválido ou token não reconhecido. Ainda não há sessões no backend
  simulado: só conexões de visitante são aceitas.
- `bus.ts`: barramento tipado; handlers REST e a API de controle publicam, o servidor entrega.
- `delivery.ts`: entrega por audiência e emissão validada: evento fora do catálogo ou fora do
  schema lança erro no handler que publicou.

### Limitações do transporte no ambiente de mocks

Comprovadas no spike de pesquisa e, quando indicado, nos testes deste repositório:

1. Só WebSocket (`transports: ['websocket']`); sem long-polling, upgrade ou WebTransport.
2. O binding 0.2.0 anuncia `pingInterval` 25000 e `pingTimeout` 5000 e não envia ping. Sem o
   heartbeat do servidor simulado, o cliente cai por `ping timeout` em cerca de 30 s. O smoke E2E
   avança o relógio 2 minutos e exige a mesma conexão; sem o heartbeat (controle negativo) a
   conexão é trocada e o teste falha.
3. `sid` fixo `test`, sem `pid` e sem recuperação de estado: a reconciliação é sempre via REST.
4. O namespace é confirmado antes da leitura do `auth`: token recusado gera `connect` seguido de
   `connect_error`, sem reconexão automática.
5. Sem namespaces (só `/`), rooms (emuladas pelo registro por usuário), acks, binário e broadcast.
6. O servidor vive na aba: cada aba tem o seu; eventos não cruzam abas.
7. Recusa antes do handshake só é percebida pelo timeout de conexão do cliente (20 s por padrão).
8. Só funciona no navegador: em Node o engine.io-client usa o pacote `ws`, que o MSW não intercepta.
9. Versões fixadas: `msw` 2.15.0 e binding 0.2.0 (o binding declara peer `msw ^2.10.2`).

## Estado remoto e cache

Pendente. Hoje o `QueryClient` usa padrões provisórios e conservadores (`staleTime` 30 s,
`gcTime` 5 min, 1 nova tentativa em consultas, nenhuma em mutations). A política final (por
recurso, com escopo por usuário, invalidação por eventos e reconciliação após reconexão) entra com
os contratos REST.

## Testes

- Unitários (Vitest, ambiente node): validação do ambiente, store observável, protocolo
  Socket.IO (leitura do CONNECT e CONNECT_ERROR), barramento, entrega e validação de eventos e
  contrato da API de controle.
- Configurações (Vitest, `tooling/`): fronteiras de importação do ESLint, verificadas com trechos de
  código por região.
- E2E (Playwright): sempre contra o build de produção servido pelo `vite preview`. Os testes abrem
  o app e esperam a renderização (que só acontece depois do `worker.start()`) antes de usar a API
  de controle; chamadas de controle saem de dentro da página para passar pelo service worker. Uma
  fixture falha o teste em exceção não tratada ou `console.error` não declarado pelo teste.
- Regressão visual: o caminho das baselines não tem `{platform}` porque elas serão geradas só em
  Linux (imagem oficial do Playwright). Pendente: projetos visuais e baselines.

## Pendências de documentação

Contratos REST e de eventos, política de sessão, estado do carrinho, estratégia de cache,
reconciliação entre REST e Socket.IO, decisões de UX e desvios do Figma.
