import { MOCK_CONTROL_BASE_PATH } from './control/contract';

// Requisições que nenhum handler atende. As do backend simulado (base da API e API de controle) não
// podem seguir para a rede: lá o fallback de SPA (preview e Vercel) responderia o index.html com
// status 200, e a falha passaria despercebida. As demais (assets, módulos do servidor do Vite)
// seguem para a rede.

// bases atendidas pelo backend simulado: a API (VITE_API_BASE_URL) e a API de controle
export function simulatedBackendBases(apiBaseUrl: string, origin: string): readonly URL[] {
  return [new URL(apiBaseUrl, origin), new URL(MOCK_CONTROL_BASE_PATH, origin)];
}

// mesma origem de uma das bases e caminho igual à base ou abaixo dela
export function isSimulatedBackendRequest(url: URL, bases: readonly URL[]): boolean {
  return bases.some((base) => {
    if (url.origin !== base.origin) return false;
    const basePath = base.pathname.replace(/\/+$/, '');
    return url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
  });
}

export function unhandledRequestMessage(method: string, url: URL): string {
  return `Requisição sem handler no backend simulado: ${method} ${url.pathname}`;
}
