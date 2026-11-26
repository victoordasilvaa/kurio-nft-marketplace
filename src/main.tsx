import './styles/globals.css';

import { getEnv } from '@/shared/config/env';

// Ordem obrigatória: o backend simulado começa antes de qualquer módulo do app ser avaliado.
// O engine.io-client guarda globalThis.WebSocket quando o módulo é carregado; se o
// socket.io-client fosse avaliado antes do worker.start(), o WebSocket não seria interceptado.
// Por isso este arquivo não importa o app de forma estática.
async function start(container: HTMLElement): Promise<void> {
  const env = getEnv();
  if (env.enableMocks) {
    const { startMockServiceWorker } = await import('./mocks/browser');
    await startMockServiceWorker();
  }
  const { renderApp } = await import('./app/bootstrap');
  renderApp(container);
}

// falha de inicialização fica visível na página, além do console
function showStartupError(container: HTMLElement, error: unknown): void {
  const alert = document.createElement('div');
  alert.setAttribute('role', 'alert');
  alert.style.padding = '1rem';
  const title = document.createElement('p');
  title.textContent = 'Não foi possível iniciar a aplicação.';
  const detail = document.createElement('pre');
  detail.style.whiteSpace = 'pre-wrap';
  detail.textContent = error instanceof Error ? error.message : String(error);
  alert.append(title, detail);
  container.replaceChildren(alert);
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemento #root não encontrado no index.html.');
}

start(container).catch((error: unknown) => {
  console.error(error);
  showStartupError(container, error);
});
