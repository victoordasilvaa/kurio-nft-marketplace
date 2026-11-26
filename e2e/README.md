# e2e

Testes Playwright contra o build de produção com o backend simulado. Configuração em
`playwright.config.ts`; comandos no `README.md` da raiz.

- `support/fixtures.ts`: `test` e `expect` do projeto. Todo teste falha em exceção não tratada na
  página ou em `console.error` não declarado; use `consoleGuard.allow(/padrão/)` quando o teste
  provoca um erro de propósito (por exemplo, uma resposta 4xx).
- `support/app.ts`: `openApp` (navega e espera o app renderizar, o que só acontece depois do
  `worker.start()`), `fetchFromPage` (requisição feita de dentro da página, para passar pelo
  service worker do MSW), `readMockState` e `controllingServiceWorker`.
- `smoke.spec.ts`: smoke do bootstrap (título, MSW, conexão Socket.IO, heartbeat, 404, refresh em
  rota profunda e API de controle).

Regras: interaja pela interface e verifique o resultado na interface; use a API de controle
(`/__mock/*`) só para preparar o cenário ou observar o servidor simulado. Não use `page.route` para
simular a API (o REST precisa passar pelos handlers do MSW) nem `page.request` (a requisição sai do
Node, fora do service worker da página). Cada teste roda num contexto novo, com storage vazio. Baselines visuais (quando existirem) ficam em `e2e/__screenshots__/` e são geradas
só em Linux.
