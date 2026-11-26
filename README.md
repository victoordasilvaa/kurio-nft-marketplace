# Kurio | Marketplace de NFTs

Implementação do desafio técnico de frontend: marketplace de NFTs em React e TypeScript, com
backend simulado na camada de rede (MSW) e tempo real via Socket.IO simulado.

> Estado atual: **fundação** (toolchain, esqueleto, bootstrap com mocks e tempo real, lint com
> fronteiras de camada, testes unitários, smoke E2E e CI). As telas e os fluxos do enunciado ainda
> não foram implementados; a lista de pendências está no fim deste arquivo.

## Requisitos

- Node.js 24.x (`.nvmrc`; verificado com 24.22.1) e npm 11 (verificado com 11.19.1).
- Chromium do Playwright 1.65.0 para os testes E2E (`npx playwright install chromium`, se ainda não
  estiver instalado na máquina).

## Instalação

```bash
npm ci
```

O npm 11 não executa o `postinstall` do `msw`. O worker `public/mockServiceWorker.js` é versionado;
depois de atualizar o `msw`, gere o arquivo de novo com `npm run mocks:init`.

## Comandos

| Comando                   | O que faz                                                                   |
| ------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`             | Servidor de desenvolvimento do Vite, com o backend simulado ligado.         |
| `npm run build`           | Verificação de tipos (`tsc -b`) e build de produção em `dist/`.             |
| `npm run preview`         | Serve o build de `dist/` (aceita `-- --port 4310 --host 127.0.0.1`).        |
| `npm run typecheck`       | Verificação de tipos de app, configurações e testes E2E.                    |
| `npm run lint`            | ESLint sem tolerância a avisos (inclui as fronteiras entre camadas).        |
| `npm run lint:fix`        | ESLint com correções automáticas.                                           |
| `npm run format`          | Formata o repositório com Prettier.                                         |
| `npm run format:check`    | Confere a formatação sem alterar arquivos.                                  |
| `npm test`                | Testes unitários e das configurações (Vitest, ambiente node).               |
| `npm run test:watch`      | Testes unitários em modo observação.                                        |
| `npm run test:e2e`        | Testes E2E (Playwright) contra o build de produção servido pelo preview.    |
| `npm run test:e2e:ui`     | Testes E2E no modo interativo do Playwright.                                |
| `npm run test:e2e:report` | Abre o último relatório HTML do Playwright.                                 |
| `npm run mocks:init`      | Regenera `public/mockServiceWorker.js` a partir da versão instalada do MSW. |

### Testes E2E

```bash
# build de produção + preview em 127.0.0.1:$PORT (padrão 4310), desktop e mobile
PORT=4310 npx playwright test --project=chromium-desktop --project=chromium-mobile

# contra um ambiente já publicado (não sobe servidor local)
PLAYWRIGHT_BASE_URL=https://exemplo.vercel.app npx playwright test
```

Projetos: `chromium-desktop` (1440x900), `chromium-mobile` (390x844, toque) e `chromium-tablet`
(768x1024). O relatório HTML fica em `playwright-report/`; traces, screenshots e vídeos das falhas
ficam em `test-results/`.

## Variáveis de ambiente

Todas são lidas pelo Vite (prefixo `VITE_`), chegam ao navegador e são validadas com zod ao iniciar
o app; configuração inválida interrompe a inicialização com a lista de problemas na tela. Não
coloque segredos nelas. Referência completa em `.env.example`.

| Variável            | Obrigatória | Padrão                      | Uso                                                 |
| ------------------- | ----------- | --------------------------- | --------------------------------------------------- |
| `VITE_ENABLE_MOCKS` | sim         | sem padrão                  | `true` liga o backend simulado; `false` desliga.    |
| `VITE_API_BASE_URL` | não         | `/api`                      | Base das chamadas REST (caminho ou URL http(s)).    |
| `VITE_REALTIME_URL` | não         | `wss://realtime.kurio.test` | Origem do servidor Socket.IO (`ws://` ou `wss://`). |

`.env.development` e `.env.production` são versionados com `VITE_ENABLE_MOCKS=true`: o
desenvolvimento, os testes E2E e o build de demonstração usam o backend simulado. Variável definida
no processo tem precedência sobre os arquivos (`VITE_ENABLE_MOCKS=false npm run build` desliga os
mocks). Sem mocks, o app chama a API e o Socket.IO reais configurados, que este projeto não fornece.

## Backend simulado

Ativo hoje (detalhes em `ARCHITECTURE.md`):

- `GET /api/health`: resposta do backend simulado (`{ "status": "ok" }`).
- `GET /__mock/state`: cenário atual e conexões de tempo real abertas (com `userId` quando houver).
- `POST /__mock/reset` com corpo opcional `{ "scenario": "default" }`: restaura o cenário.
- Servidor Socket.IO em `VITE_REALTIME_URL`, atendido pelo MSW na própria aba.

O único cenário disponível é `default`. Cenários de falha, fixtures, usuários e credenciais
fictícias são pendências das próximas fases.

## Estrutura

```
src/
  main.tsx          inicialização: valida o ambiente, liga os mocks e só então carrega o app
  app/              composição: router, query client, providers, bootstrap e casca (layout, 404)
  routes/           rotas de arquivo do TanStack Router (finas: só ligam rota e página)
  features/         funcionalidades por domínio (hoje só a página inicial provisória do catálogo)
  shared/           config (ambiente), lib (utilitários), realtime (único uso do socket.io-client)
  components/ui/    componentes do shadcn/ui (base Base UI)
  mocks/            backend simulado (MSW): REST, API de controle e servidor Socket.IO
  styles/           CSS global e tema do Tailwind
e2e/                testes Playwright e utilitários de teste
tooling/            testes das configurações do repositório (fronteiras do ESLint)
```

As fronteiras entre camadas são verificadas pelo ESLint (regras `kurio/boundaries/*` em
`eslint.config.js`, com casos em `tooling/eslint-boundaries.test.ts`): `socket.io-client` só em
`src/shared/realtime`, `axios` só em `src/shared/api` e `src/mocks` só em `src/main.tsx`,
`src/mocks` e `e2e`. Valem para import estático e dinâmico (só com string literal), pelo alias e por
caminho relativo.

## CI e deploy

- CI (`.github/workflows/ci.yml`, em push e pull request): `npm ci`, tipos, lint, testes unitários,
  build e E2E em desktop e mobile, com relatório e resultados publicados como artefatos.
- Vercel (`vercel.json`): fallback de SPA para `index.html`, `no-cache` para o
  `mockServiceWorker.js` e cache imutável para `/assets`. O deploy público ainda não foi feito.

## Pendências

- Design system com os tokens e fontes do Figma; telas desktop e mobile.
- Contratos REST e de eventos de domínio (`nft.updated`, `order.updated`), cliente Axios e política
  final de cache, retry e sincronização.
- Cenários determinísticos de mocks, fixtures, dois usuários fictícios, persistência e reset completo.
- Autenticação, catálogo, detalhe, favoritos, carrinho, pagamento, confirmação, perfil e carteiras.
- Regressão visual com baselines Linux, auditoria Lighthouse e deploy público.
