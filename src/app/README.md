# src/app

Composição da aplicação: cria e liga as peças, sem regra de negócio.

- `bootstrap.tsx`: query client, router, conexão de tempo real, providers e render (carregado por
  import dinâmico em `src/main.tsx`, depois do backend simulado).
- `router.tsx` e `router-context.ts`: `createRouter` com a árvore gerada e o contexto das rotas
  (`{ queryClient }`).
- `query-client.ts`: `QueryClient` com padrões provisórios.
- `devtools.tsx`: devtools do Router e do Query, carregadas só em desenvolvimento.
- `shell/`: casca da aplicação (layout raiz e página 404).

Pode importar `features`, `shared` e `components`. Não importa `src/mocks` nem clientes de rede
(`axios`, `socket.io-client`) diretamente.
