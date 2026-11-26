import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

// Fronteiras de importação do eslint.config.js verificadas com trechos de código, sem criar
// arquivos: o caminho informado decide qual região de fronteira se aplica ao trecho.

const rootDir = fileURLToPath(new URL('..', import.meta.url));

const STATIC = 'no-restricted-imports';
const DYNAMIC = 'no-restricted-syntax';
type BoundaryRule = typeof STATIC | typeof DYNAMIC;

// trecho que identifica a mensagem de cada fronteira (texto completo no eslint.config.js)
const REALTIME = 'socket.io-client só pode ser importado em src/shared/realtime';
const HTTP = 'axios só pode ser importado em src/shared/api';
const MOCK_LIBRARIES = 'MSW e o protocolo Socket.IO simulado são exclusivos';
const MOCKS = 'O backend simulado (src/mocks) só pode ser importado por';
const APP_SHELL = 'Features não dependem da composição da aplicação';
const UPPER_LAYERS = 'Camadas compartilhadas não dependem de app, rotas ou features';
const USER_INTERFACE = 'O backend simulado compartilha só contratos e configuração';
const REALTIME_CLIENT_MODULES = 'O backend simulado usa de src/shared/realtime só o contrato';
const ENTRY = 'src/main.tsx importa de forma estática só o ambiente';
const LITERAL_ONLY = 'Import dinâmico só com string literal';
const NO_GLOB = 'import.meta.glob não é usado';

type Finding = readonly [rule: BoundaryRule, fragment: string];

interface BoundaryCase {
  name: string;
  file: string;
  code: string;
  expected: readonly Finding[];
}

const FEATURE = 'src/features/catalog/boundary-probe.ts';
const SHARED = 'src/shared/config/boundary-probe.ts';
const COMPONENTS = 'src/components/ui/boundary-probe.tsx';
const API = 'src/shared/api/boundary-probe.ts';
const REALTIME_LAYER = 'src/shared/realtime/boundary-probe.ts';
const MOCKS_LAYER = 'src/mocks/boundary-probe.ts';
const APP = 'src/app/boundary-probe.ts';
const ENTRY_FILE = 'src/main.tsx';
const E2E = 'e2e/boundary-probe.spec.ts';

const cases: BoundaryCase[] = [
  // features
  {
    name: 'features: axios estático',
    file: FEATURE,
    code: "import axios from 'axios';",
    expected: [[STATIC, HTTP]],
  },
  {
    name: 'features: axios dinâmico com string literal',
    file: FEATURE,
    code: "export const load = () => import('axios');",
    expected: [[DYNAMIC, HTTP]],
  },
  {
    name: 'features: axios dinâmico com template literal sem interpolação',
    file: FEATURE,
    code: 'export const load = () => import(`axios`);',
    expected: [[DYNAMIC, LITERAL_ONLY]],
  },
  {
    name: 'features: socket.io-client dinâmico com template literal sem interpolação',
    file: FEATURE,
    code: 'export const load = () => import(`socket.io-client`);',
    expected: [[DYNAMIC, LITERAL_ONLY]],
  },
  {
    name: 'features: especificador montado em tempo de execução',
    file: FEATURE,
    code: "export const load = (name: string) => import('./' + name);",
    expected: [[DYNAMIC, LITERAL_ONLY]],
  },
  {
    name: 'features: import.meta.glob',
    file: FEATURE,
    code: "export const modules = import.meta.glob('../../mocks/**/*.ts');",
    expected: [[DYNAMIC, NO_GLOB]],
  },
  {
    name: 'features: socket.io-client estático, só de tipo, reexportado e engine.io-client',
    file: FEATURE,
    code: [
      "import { io } from 'socket.io-client';",
      "import type { Socket } from 'socket.io-client';",
      "export { Manager } from 'socket.io-client';",
      "import 'engine.io-client';",
    ].join('\n'),
    expected: [
      [STATIC, REALTIME],
      [STATIC, REALTIME],
      [STATIC, REALTIME],
      [STATIC, REALTIME],
    ],
  },
  {
    name: 'features: bibliotecas de mock',
    file: FEATURE,
    code: "import { http } from 'msw';\nexport const load = () => import('socket.io-parser');",
    expected: [
      [STATIC, MOCK_LIBRARIES],
      [DYNAMIC, MOCK_LIBRARIES],
    ],
  },
  {
    name: 'features: src/mocks pelo alias, por caminho relativo e dinâmico',
    file: FEATURE,
    code: [
      "import { worker } from '@/mocks/browser';",
      "import { handlers } from '../../mocks/handlers';",
      "export const load = () => import('@/mocks/runtime');",
    ].join('\n'),
    expected: [
      [STATIC, MOCKS],
      [STATIC, MOCKS],
      [DYNAMIC, MOCKS],
    ],
  },
  {
    name: 'features: composição da aplicação pelo alias, por caminho relativo e dinâmica',
    file: FEATURE,
    code: [
      "import { createQueryClient } from '@/app/query-client';",
      "import { createAppRouter } from '../../app/router';",
      "import { routeTree } from '@/routeTree.gen';",
      "export const load = () => import('../../routes/index');",
    ].join('\n'),
    expected: [
      [STATIC, APP_SHELL],
      [STATIC, APP_SHELL],
      [STATIC, APP_SHELL],
      [DYNAMIC, APP_SHELL],
    ],
  },
  {
    name: 'features: shared e components permitidos',
    file: FEATURE,
    code: [
      "import { getEnv } from '@/shared/config/env';",
      "import { Button } from '@/components/ui/button';",
      "export const load = () => import('@/shared/lib/create-store');",
    ].join('\n'),
    expected: [],
  },
  // camadas compartilhadas
  {
    name: 'shared: features pelo alias e por caminho relativo',
    file: SHARED,
    code: [
      "import { HomePage } from '@/features/catalog/home-page';",
      "import { HomePage as Page } from '../../features/catalog/home-page';",
    ].join('\n'),
    expected: [
      [STATIC, UPPER_LAYERS],
      [STATIC, UPPER_LAYERS],
    ],
  },
  {
    name: 'shared: axios fora de src/shared/api',
    file: SHARED,
    code: "import axios from 'axios';",
    expected: [[STATIC, HTTP]],
  },
  {
    name: 'components: composição da aplicação dinâmica',
    file: COMPONENTS,
    code: "export const load = () => import('@/app/router');",
    expected: [[DYNAMIC, UPPER_LAYERS]],
  },
  {
    name: 'shared/api: axios permitido, socket.io-client não',
    file: API,
    code: "import axios from 'axios';\nimport { io } from 'socket.io-client';",
    expected: [[STATIC, REALTIME]],
  },
  {
    name: 'shared/realtime: socket.io-client permitido, axios não',
    file: REALTIME_LAYER,
    code: "import { io } from 'socket.io-client';\nexport const load = () => import('axios');",
    expected: [[DYNAMIC, HTTP]],
  },
  // backend simulado
  {
    name: 'mocks: msw, binding, parser, ambiente, contrato e eventos permitidos',
    file: MOCKS_LAYER,
    code: [
      "import { toSocketIo } from '@mswjs/socket.io-binding';",
      "import { http } from 'msw';",
      "import { Decoder } from 'socket.io-parser';",
      "import { getEnv } from '@/shared/config/env';",
      "import { realtimeAuthSchema } from '@/shared/realtime/contract';",
      "import { serverToClientEventSchemas } from '@/shared/realtime/events';",
      "import { createMockBackendStore } from './state';",
    ].join('\n'),
    expected: [],
  },
  {
    name: 'mocks: clientes de rede',
    file: MOCKS_LAYER,
    code: "import { io } from 'socket.io-client';\nexport const load = () => import('axios');",
    expected: [
      [STATIC, REALTIME],
      [DYNAMIC, HTTP],
    ],
  },
  {
    name: 'mocks: interface pelo alias e por caminho relativo',
    file: 'src/mocks/handlers/boundary-probe.ts',
    code: [
      "import { Button } from '@/components/ui/button';",
      "import { HomePage } from '../../features/catalog/home-page';",
      "import { cn } from '@/lib/utils';",
    ].join('\n'),
    expected: [
      [STATIC, USER_INTERFACE],
      [STATIC, USER_INTERFACE],
      [STATIC, USER_INTERFACE],
    ],
  },
  {
    name: 'mocks: cliente, provider e contexto de tempo real',
    file: 'src/mocks/realtime/boundary-probe.ts',
    code: [
      "import { createRealtimeClient } from '@/shared/realtime/socket';",
      "import { RealtimeProvider } from '@/shared/realtime/realtime-provider';",
      "import { useRealtimeClient } from '../../shared/realtime/realtime-context';",
      "export const load = () => import('@/shared/realtime/socket');",
    ].join('\n'),
    expected: [
      [STATIC, REALTIME_CLIENT_MODULES],
      [STATIC, REALTIME_CLIENT_MODULES],
      [STATIC, REALTIME_CLIENT_MODULES],
      [DYNAMIC, REALTIME_CLIENT_MODULES],
    ],
  },
  // entrada
  {
    name: 'entrada: ambiente e CSS estáticos, mocks e app dinâmicos permitidos',
    file: ENTRY_FILE,
    code: [
      "import './styles/globals.css';",
      "import { getEnv } from '@/shared/config/env';",
      "export const loadMocks = () => import('./mocks/browser');",
      "export const loadApp = () => import('./app/bootstrap');",
    ].join('\n'),
    expected: [],
  },
  {
    name: 'entrada: app, tempo real, mocks e rotas estáticos',
    file: ENTRY_FILE,
    code: [
      "import { renderApp } from './app/bootstrap';",
      "import { createAppRouter } from '@/app/router';",
      "import { createRealtimeClient } from '@/shared/realtime/socket';",
      "import { RealtimeProvider } from './shared/realtime/realtime-provider';",
      "import { startMockServiceWorker } from './mocks/browser';",
      "import { routeTree } from './routeTree.gen';",
      "import { HomePage } from './features/catalog/home-page';",
    ].join('\n'),
    expected: [
      [STATIC, ENTRY],
      [STATIC, ENTRY],
      [STATIC, ENTRY],
      [STATIC, ENTRY],
      [STATIC, ENTRY],
      [STATIC, ENTRY],
      [STATIC, ENTRY],
    ],
  },
  {
    name: 'entrada: clientes de rede e msw',
    file: ENTRY_FILE,
    code: [
      "import { io } from 'socket.io-client';",
      "import axios from 'axios';",
      "export const load = () => import('msw');",
    ].join('\n'),
    expected: [
      [STATIC, REALTIME],
      [STATIC, HTTP],
      [DYNAMIC, MOCK_LIBRARIES],
    ],
  },
  // composição e testes E2E
  {
    name: 'app: src/mocks dinâmico barrado, features permitidas',
    file: APP,
    code: [
      "import { HomePage } from '@/features/catalog/home-page';",
      "export const load = () => import('../mocks/browser');",
    ].join('\n'),
    expected: [[DYNAMIC, MOCKS]],
  },
  {
    name: 'e2e: contrato da API de controle permitido, msw e axios não',
    file: E2E,
    code: [
      "import { mockStateSchema } from '../src/mocks/control/contract';",
      "import { http } from 'msw';",
      "import axios from 'axios';",
    ].join('\n'),
    expected: [
      [STATIC, MOCK_LIBRARIES],
      [STATIC, HTTP],
    ],
  },
];

let eslint: ESLint;

beforeAll(async () => {
  eslint = new ESLint({
    cwd: rootDir,
    // só as regras de fronteira, que dependem apenas da sintaxe; sem informação de tipos, o parser
    // não exige que o arquivo exista em um tsconfig
    ruleFilter: ({ ruleId }) => ruleId === STATIC || ruleId === DYNAMIC,
    overrideConfig: {
      files: ['**/*.{ts,tsx}'],
      languageOptions: { parserOptions: { projectService: false } },
    },
  });
  // carrega a configuração e os plugins uma vez, fora do tempo de cada teste
  await eslint.lintText('', { filePath: path.join(rootDir, ENTRY_FILE) });
}, 60_000);

// cada achado vira "regra: trecho esperado" quando corresponde a uma fronteira esperada; os demais
// aparecem com a mensagem completa, para o diff mostrar o que o ESLint reportou
async function findingsFor(file: string, code: string, expected: readonly Finding[]) {
  const results = await eslint.lintText(code, { filePath: path.join(rootDir, file) });
  return results
    .flatMap((result) => result.messages)
    .map(({ ruleId, message }) => {
      const known = expected.find(
        ([rule, fragment]) => rule === ruleId && message.includes(fragment),
      );
      return known ? `${known[0]}: ${known[1]}` : `${ruleId ?? 'erro de análise'}: ${message}`;
    })
    .sort();
}

describe('fronteiras de importação (eslint.config.js)', () => {
  it.each(cases)('$name', async ({ file, code, expected }) => {
    const findings = await findingsFor(file, code, expected);

    expect(findings).toEqual(expected.map(([rule, fragment]) => `${rule}: ${fragment}`).sort());
  });
});
