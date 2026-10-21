import { describe, expect, it, vi } from 'vitest';
import worker from './worker';

describe('Cloudflare static assets worker', () => {
  it.each(['/', '/assets/app.js', '/estimate?city=shanghai'])('serves %s on the new domain without redirecting', async (path) => {
    const request = new Request(`https://severance.masonhu.org${path}`);
    const assetResponse = new Response('asset content', { headers: { 'Content-Type': 'text/html' } });
    const fetchAsset = vi.fn().mockResolvedValue(assetResponse);
    const response = await worker.fetch(request, { ASSETS: { fetch: fetchAsset } });

    expect(fetchAsset).toHaveBeenCalledTimes(1);
    expect(fetchAsset).toHaveBeenCalledWith(request);
    expect(response).toBe(assetResponse);
  });
});
