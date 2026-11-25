import './styles/globals.css';

import { getEnv } from '@/shared/config/env';

async function start(container: HTMLElement): Promise<void> {
  // valida a configuração antes de carregar qualquer outra parte da aplicação
  getEnv();
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
