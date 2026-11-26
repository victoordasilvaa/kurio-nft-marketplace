# tooling

Testes das configurações do repositório, rodados pelo `npm test` (Vitest, ambiente node) junto com
os unitários de `src`.

- `eslint-boundaries.test.ts`: fronteiras de importação do `eslint.config.js`, verificadas com
  trechos de código permitidos e proibidos em cada região (features, camadas compartilhadas,
  `src/shared/api`, `src/shared/realtime`, `src/mocks`, `src/main.tsx`, `src/app` e `e2e`). O
  caminho informado ao ESLint decide a região; nenhum arquivo é criado. Ao mudar uma fronteira,
  acrescente aqui o caso permitido e o proibido.
