import { setupWorker } from 'msw/browser';

import { getEnv } from '@/shared/config/env';

import { handlers } from './handlers';
import {
  isSimulatedBackendRequest,
  simulatedBackendBases,
  unhandledRequestMessage,
} from './unhandled-request';

export const worker = setupWorker(...handlers);

export async function startMockServiceWorker(): Promise<void> {
  const backendBases = simulatedBackendBases(getEnv().apiBaseUrl, window.location.origin);

  await worker.start({
    // caminho absoluto: o registro funciona em qualquer rota profunda
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    quiet: import.meta.env.PROD,
    onUnhandledRequest(request, print) {
      const url = new URL(request.url);
      // assets estáticos e módulos do servidor do Vite seguem para a rede sem aviso
      if (!isSimulatedBackendRequest(url, backendBases)) return;
      // Chamada ao backend simulado sem handler: erro no console e requisição interrompida.
      // No msw 2.15 o print.error() só imprime; é a exceção que impede a passagem para a rede
      // (o MSW responde 500 "Request Handler Error" com a mensagem abaixo).
      print.error();
      throw new Error(unhandledRequestMessage(request.method, url));
    },
  });
}
