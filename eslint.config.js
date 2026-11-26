import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Fronteiras de importação. Cada grupo descreve, por uma expressão regular sobre o especificador,
// módulos que só podem ser importados em uma camada; as regiões abaixo dizem o que cada camada não
// pode importar. O mesmo regex vale para import estático (no-restricted-imports) e dinâmico
// (no-restricted-syntax), exceto nos grupos marcados com staticOnly.
// Os casos de cada região são verificados em tooling/eslint-boundaries.test.ts.
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const anyOf = (names) => names.map(escapeRegExp).join('|');

// pacotes e seus subcaminhos (ex.: msw e msw/browser)
const packagesGroup = (packages, message) => ({
  regex: `^(${anyOf(packages)})(\\/|$)`,
  message,
});

// pastas de src pelo alias (@/app) ou por caminho relativo que sobe de pasta (../../app)
const foldersGroup = (folders, message) => ({
  regex: `^(@\\/|(\\.\\.\\/)+)(${anyOf(folders)})(\\/|$)`,
  message,
});

const groups = {
  realtimeClient: packagesGroup(
    ['socket.io-client', 'engine.io-client'],
    'socket.io-client só pode ser importado em src/shared/realtime/**.',
  ),
  httpClient: packagesGroup(['axios'], 'axios só pode ser importado em src/shared/api/**.'),
  mockLibraries: packagesGroup(
    ['msw', '@mswjs/socket.io-binding', '@mswjs/interceptors', 'socket.io-parser'],
    'MSW e o protocolo Socket.IO simulado são exclusivos do backend simulado (src/mocks/**).',
  ),
  mocks: {
    regex: '(^|\\/)mocks(\\/|$)',
    message:
      'O backend simulado (src/mocks) só pode ser importado por src/main.tsx, src/mocks/** e e2e/**.',
  },
  appShell: foldersGroup(
    ['app', 'routes', 'routeTree.gen'],
    'Features não dependem da composição da aplicação (src/app, src/routes).',
  ),
  upperLayers: foldersGroup(
    ['app', 'routes', 'routeTree.gen', 'features'],
    'Camadas compartilhadas não dependem de app, rotas ou features.',
  ),
  userInterface: foldersGroup(
    ['app', 'routes', 'routeTree.gen', 'features', 'components', 'lib'],
    'O backend simulado compartilha só contratos e configuração (src/shared), nunca interface.',
  ),
  // o cliente (socket.ts e o provider que o usa) avaliaria o engine.io-client antes do
  // worker.start()
  realtimeClientModules: {
    regex: '^(@\\/|(\\.\\.\\/)+)shared\\/realtime(\\/(?!(contract|events)$)|$)',
    message:
      'O backend simulado usa de src/shared/realtime só o contrato e o catálogo de eventos (contract, events).',
  },
  // main.tsx carrega mocks e app por import dinâmico, depois do worker.start() (ARCHITECTURE.md)
  entryStaticImports: {
    regex: '^(\\.{1,2}\\/|@\\/)(?!(shared\\/config|styles)\\/)',
    message:
      'src/main.tsx importa de forma estática só o ambiente (src/shared/config) e o CSS (src/styles); o resto entra por import dinâmico, depois do worker.start().',
    staticOnly: true,
  },
};

// A fronteira de um import dinâmico é verificada pelo especificador: ele precisa ser uma string
// literal, e o import.meta.glob do Vite (que importa por padrão de caminho) não é usado.
const dynamicImportRules = [
  {
    selector: "ImportExpression[source.type!='Literal']",
    message: 'Import dinâmico só com string literal (a fronteira é verificada pelo especificador).',
  },
  {
    selector:
      "MemberExpression[object.type='MetaProperty'][object.meta.name='import'][property.name=/^glob/]",
    message: 'import.meta.glob não é usado: importe cada módulo por um especificador literal.',
  },
];

const restrictImports = (...restricted) => ({
  'no-restricted-imports': [
    'error',
    { patterns: restricted.map(({ regex, message }) => ({ regex, message })) },
  ],
  'no-restricted-syntax': [
    'error',
    ...dynamicImportRules,
    ...restricted
      .filter(({ staticOnly }) => staticOnly !== true)
      .map(({ regex, message }) => ({
        selector: `ImportExpression[source.value=/${regex}/]`,
        message,
      })),
  ],
});

const {
  realtimeClient,
  httpClient,
  mockLibraries,
  mocks,
  appShell,
  upperLayers,
  userInterface,
  realtimeClientModules,
  entryStaticImports,
} = groups;

export default defineConfig([
  globalIgnores([
    'dist/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    'blob-report/',
    '.lighthouseci/',
    'lighthouse/reports/',
    'src/routeTree.gen.ts',
    'public/mockServiceWorker.js',
  ]),
  {
    // comentários eslint-disable não têm efeito: regra não se desliga para passar
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
  },
  {
    name: 'kurio/javascript',
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    name: 'kurio/typescript',
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-check': false, 'ts-expect-error': true, 'ts-ignore': true, 'ts-nocheck': true },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    name: 'kurio/react',
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      pluginQuery.configs['flat/recommended-strict'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    name: 'kurio/node',
    files: ['*.config.ts', 'e2e/**/*.ts', 'tooling/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  // regiões de fronteira (a última que casa com o arquivo vence)
  {
    name: 'kurio/boundaries/default',
    files: ['**/*.{ts,tsx}'],
    rules: restrictImports(realtimeClient, httpClient, mockLibraries, mocks),
  },
  {
    name: 'kurio/boundaries/features',
    files: ['src/features/**'],
    rules: restrictImports(realtimeClient, httpClient, mockLibraries, mocks, appShell),
  },
  {
    name: 'kurio/boundaries/shared-layers',
    files: ['src/shared/**', 'src/components/**', 'src/lib/**'],
    rules: restrictImports(realtimeClient, httpClient, mockLibraries, mocks, upperLayers),
  },
  {
    name: 'kurio/boundaries/realtime',
    files: ['src/shared/realtime/**'],
    rules: restrictImports(httpClient, mockLibraries, mocks, upperLayers),
  },
  {
    name: 'kurio/boundaries/api',
    files: ['src/shared/api/**'],
    rules: restrictImports(realtimeClient, mockLibraries, mocks, upperLayers),
  },
  {
    name: 'kurio/boundaries/mocks',
    files: ['src/mocks/**'],
    rules: restrictImports(realtimeClient, httpClient, userInterface, realtimeClientModules),
  },
  {
    name: 'kurio/boundaries/entry',
    files: ['src/main.tsx'],
    rules: restrictImports(realtimeClient, httpClient, mockLibraries, entryStaticImports),
  },
  {
    name: 'kurio/boundaries/e2e',
    files: ['e2e/**'],
    rules: restrictImports(realtimeClient, httpClient, mockLibraries),
  },
]);
