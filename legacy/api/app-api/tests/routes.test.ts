import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { MockAtlasRepository } from '../src/repositories/mockRepository';

describe('API routes', () => {
  it('returns health payload', async () => {
    const app = buildApp(new MockAtlasRepository());
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.ok).toBe(true);
    expect(body.data.mode).toBe('mock');
    await app.close();
  });

  it('returns organism detail for seeded organism', async () => {
    const app = buildApp(new MockAtlasRepository());
    const response = await app.inject({
      method: 'GET',
      url: '/api/organisms/org-solenopsis-invicta',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.organism.scientificName).toBe('Solenopsis invicta');
    expect(body.data.deliveryMechanism.route).toBe('sting');
    await app.close();
  });
});
