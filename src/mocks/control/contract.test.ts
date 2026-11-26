import { describe, expect, it } from 'vitest';

import { mockResetRequestSchema } from './contract';

describe('mockResetRequestSchema', () => {
  it('usa o cenário padrão quando o corpo é vazio', () => {
    expect(mockResetRequestSchema.parse({})).toEqual({ scenario: 'default' });
  });

  it('aceita um cenário conhecido', () => {
    expect(mockResetRequestSchema.parse({ scenario: 'default' })).toEqual({ scenario: 'default' });
  });

  it('recusa cenário desconhecido', () => {
    expect(mockResetRequestSchema.safeParse({ scenario: 'inexistente' }).success).toBe(false);
  });

  it('recusa campos fora do contrato', () => {
    expect(mockResetRequestSchema.safeParse({ scenario: 'default', seed: 1 }).success).toBe(false);
  });
});
