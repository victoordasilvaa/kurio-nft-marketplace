# tooling

Testes das configurações do repositório, rodados pelo `npm test` (Vitest, ambiente node) junto com
os unitários de `src`.

- `eslint-boundaries.test.ts`: fronteiras de importação do `eslint.config.js`, verificadas com
  trechos de código permitidos e proibidos em cada região (features, camadas compartilhadas,
  `src/shared/api`, `src/shared/realtime`, `src/mocks`, `src/main.tsx`, `src/app` e `e2e`). O
  caminho informado ao ESLint decide a região; nenhum arquivo é criado. Ao mudar uma fronteira,
  acrescente aqui o caso permitido e o proibido.
- `playwright-image.test.ts`: `@playwright/test` e `playwright-core` na mesma versão exata, e toda
  referência à imagem oficial (`mcr.microsoft.com/playwright:vX.Y.Z-...`) em workflows,
  `playwright.config.ts` e documentação com a tag dessa versão. Com tag diferente, o Playwright não
  encontra os navegadores da imagem.
