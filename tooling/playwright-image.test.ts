import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// A imagem oficial do Playwright traz os navegadores da própria versão: com tag diferente da
// versão instalada do @playwright/test, o Playwright não encontra os navegadores dentro dela.

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const IMAGE_REFERENCE = /mcr\.microsoft\.com\/playwright:v(\d+\.\d+\.\d+)/g;

const packageJsonSchema = z.object({
  devDependencies: z.object({
    '@playwright/test': z.string(),
    'playwright-core': z.string(),
  }),
});

function readText(file: string): string {
  return readFileSync(path.join(rootDir, file), 'utf8');
}

// onde a imagem pode ser citada: workflows do CI, configuração do Playwright e documentação
function filesThatMayReferenceImage(): string[] {
  const workflows = readdirSync(path.join(rootDir, '.github', 'workflows'))
    .filter((name) => /\.ya?ml$/.test(name))
    .map((name) => `.github/workflows/${name}`);
  return [...workflows, 'playwright.config.ts', 'ARCHITECTURE.md', 'README.md', 'e2e/README.md'];
}

const { devDependencies } = packageJsonSchema.parse(JSON.parse(readText('package.json')));
const installedVersion = devDependencies['@playwright/test'];

describe('imagem oficial do Playwright', () => {
  it('@playwright/test e playwright-core estão na mesma versão exata', () => {
    expect(devDependencies['playwright-core']).toBe(installedVersion);
  });

  it('toda referência à imagem usa a tag da versão instalada', () => {
    const references = filesThatMayReferenceImage().flatMap((file) =>
      Array.from(readText(file).matchAll(IMAGE_REFERENCE), (match) => ({
        file,
        version: match[1],
      })),
    );

    // a configuração do Playwright registra a imagem das baselines visuais
    expect(references.map(({ file }) => file)).toContain('playwright.config.ts');
    expect(references.filter(({ version }) => version !== installedVersion)).toEqual([]);
  });
});
