import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';
import { defineConfig, globalIgnores } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Fronteiras de importação. Cada grupo lista módulos que só podem ser importados
// em uma camada específica; as regiões abaixo dizem o que cada camada não pode importar.
// O grupo vale para import estático (no-restricted-imports) e dinâmico (no-restricted-syntax).
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const modulesGroup = (modules, message) => ({
  patterns: modules.flatMap((name) => [name, `${name}/*`]),
  regex: `^(${modules.map(escapeRegExp).join('|')})(\\/|$)`,
  message,
});
const aliasGroup = (folders, message) => ({
  patterns: folders.flatMap((folder) => [`@/${folder}`, `@/${folder}/**`]),
  regex: `^@\\/(${folders.join('|')})(\\/|$)`,
  message,
});

const groups = {
  realtimeClient: modulesGroup(
    ['socket.io-client', 'engine.io-client'],
    'socket.io-client só pode ser importado em src/shared/realtime/**.',
  ),
  httpClient: modulesGroup(['axios'], 'axios só pode ser importado em src/shared/api/**.'),
  mockLibraries: modulesGroup(
    ['msw', '@mswjs/socket.io-binding', '@mswjs/interceptors', 'socket.io-parser'],
    'MSW e o protocolo Socket.IO simulado são exclusivos do backend simulado (src/mocks/**).',
  ),
  mocks: {
    patterns: ['**/mocks', '**/mocks/**'],
    regex: '(^|\\/)mocks(\\/|$)',
    message:
      'O backend simulado (src/mocks) só pode ser importado por src/main.tsx, src/mocks/** e e2e/**.',
  },
  appShell: aliasGroup(
    ['app', 'routes'],
    'Features não dependem da composição da aplicação (src/app, src/routes).',
  ),
  upperLayers: aliasGroup(
    ['app', 'routes', 'features'],
    'Camadas compartilhadas não dependem de app, rotas ou features.',
  ),
  userInterface: aliasGroup(
    ['app', 'routes', 'features', 'components', 'lib'],
    'O backend simulado compartilha só contratos e configuração (src/shared), nunca interface.',
  ),
};

const restrictImports = (...restricted) => ({
  'no-restricted-imports': [
    'error',
    { patterns: restricted.map(({ patterns, message }) => ({ group: patterns, message })) },
  ],
  'no-restricted-syntax': [
    'error',
    ...restricted.map(({ regex, message }) => ({
      selector: `ImportExpression[source.value=/${regex}/]`,
      message,
    })),
  ],
});

const { realtimeClient, httpClient, mockLibraries, mocks, appShell, upperLayers, userInterface } =
  groups;

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
    files: ['*.config.ts', 'e2e/**/*.ts'],
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
    rules: restrictImports(realtimeClient, httpClient, userInterface),
  },
  {
    name: 'kurio/boundaries/entry',
    files: ['src/main.tsx'],
    rules: restrictImports(realtimeClient, httpClient, mockLibraries),
  },
  {
    name: 'kurio/boundaries/e2e',
    files: ['e2e/**'],
    rules: restrictImports(realtimeClient, httpClient, mockLibraries),
  },
]);
