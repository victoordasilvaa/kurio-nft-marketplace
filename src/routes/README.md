# src/routes

Rotas de arquivo do TanStack Router. O plugin do Vite gera `src/routeTree.gen.ts` (versionado,
não editar) e divide o código por rota (`autoCodeSplitting`).

Arquivos de rota são finos: ligam caminho, validação dos parâmetros de busca, guardas, loader e o
componente da página, que vem de `src/features` ou de `src/app/shell`. Componentes não são
declarados aqui, porque o Fast Refresh exige que arquivos `.tsx` exportem só componentes e a rota
exporta `Route`. Arquivos com prefixo `-` são ignorados pelo gerador.
