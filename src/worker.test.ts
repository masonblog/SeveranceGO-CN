import { describe, expect, it, vi } from 'vitest';
import worker from './worker';

describe('Cloudflare domain migration', () => {
  it.each([
    ['https://severance.masonhu.cc/', 'https://severance.masonhu.org/'],
    ['http://severance.masonhu.cc/', 'https://severance.masonhu.org/'],
    [
      'https://severance.masonhu.cc/estimate/%E4%B8%8A%E6%B5%B7?from=old&tag=a&tag=b',
      'https://severance.masonhu.org/estimate/%E4%B8%8A%E6%B5%B7?from=old&tag=a&tag=b',
    ],
    ['https://severance.masonhu.cc/assets/app.js', 'https://severance.masonhu.org/assets/app.js'],
    ['http://severance.masonhu.cc:8080/?source=legacy', 'https://severance.masonhu.org/?source=legacy'],
  ])('permanently redirects %s while retaining its path and query', async (source, target) => {
    const fetchAsset = vi.fn();
    const response = await worker.fetch(new Request(source), { ASSETS: { fetch: fetchAsset } });

    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe(target);
    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it.each(['GET', 'HEAD', 'POST'])('redirects legacy %s requests before serving assets', async (method) => {
    const fetchAsset = vi.fn();
    const response = await worker.fetch(new Request('https://severance.masonhu.cc/?from=old', { method }), {
      ASSETS: { fetch: fetchAsset },
    });

    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe('https://severance.masonhu.org/?from=old');
    expect(fetchAsset).not.toHaveBeenCalled();
  });

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
