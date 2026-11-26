import { setupWorker } from 'msw/browser';

import { getEnv } from '@/shared/config/env';

import { MOCK_CONTROL_BASE_PATH } from './control/contract';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function startMockServiceWorker(): Promise<void> {
  const apiBase = new URL(`${getEnv().apiBaseUrl}/`, window.location.origin);
  const controlBase = new URL(`${MOCK_CONTROL_BASE_PATH}/`, window.location.origin);

  await worker.start({
    // caminho absoluto: o registro funciona em qualquer rota profunda
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    quiet: import.meta.env.PROD,
    onUnhandledRequest(request, print) {
      // assets estáticos (scripts, estilos, fontes, imagens) seguem para a rede sem aviso;
      // chamada de API sem handler é avisada no console
      if (request.url.startsWith(apiBase.href) || request.url.startsWith(controlBase.href)) {
        print.warning();
      }
    },
  });
}
