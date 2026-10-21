import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config, syncRedirect, verifyPublicRedirects } from './sync-cloudflare-redirect.mjs';

const zone = { id: 'legacy-zone', name: 'masonhu.cc', account: { id: 'account' } };
const managedRule = { id: 'managed-rule', ...config.rule };
const otherRule = { id: 'other-rule', ref: 'unrelated', action: 'redirect', expression: 'http.host eq "other.masonhu.cc"' };
const ruleset = rules => ({ id: 'redirect-ruleset', rules });
const response = (result, status = 200) => new Response(JSON.stringify({ success: status < 400, result, errors: [] }), { status });
const options = request => ({ token: 'test-token', accountId: 'account', request });

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('Cloudflare redirect API synchronization', () => {
  it('creates the phase entrypoint when none exists and verifies the saved rule', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(response([zone]))
      .mockResolvedValueOnce(response(null, 404))
      .mockResolvedValueOnce(response(ruleset([managedRule])))
      .mockResolvedValueOnce(response(ruleset([managedRule])));
    await syncRedirect(options(request));

    expect(request.mock.calls[0][0]).toContain('/zones?name=masonhu.cc&account.id=account&status=active');
    const [url, init] = request.mock.calls[2];
    expect(url).toBe('https://api.cloudflare.com/client/v4/zones/legacy-zone/rulesets');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-token');
    const body = JSON.parse(init.body);
    expect(body.phase).toBe('http_request_dynamic_redirect');
    expect(body.rules[0]).toMatchObject({
      expression: '(http.host eq "severance.masonhu.cc")',
      action: 'redirect',
      enabled: true,
      action_parameters: { from_value: {
        target_url: { expression: 'concat("https://severance.masonhu.org", http.request.uri.path)' },
        status_code: 308,
        preserve_query_string: true,
      } },
    });
    expect(request.mock.calls[3][0]).toContain('/phases/http_request_dynamic_redirect/entrypoint');
  });

  it('adds only the managed rule to an existing ruleset, preserving unrelated rules', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(response([zone]))
      .mockResolvedValueOnce(response(ruleset([otherRule])))
      .mockResolvedValueOnce(response(ruleset([managedRule, otherRule])))
      .mockResolvedValueOnce(response(ruleset([managedRule, otherRule])));
    await syncRedirect(options(request));
    const [url, init] = request.mock.calls[2];
    expect(url).toContain('/rulesets/redirect-ruleset/rules');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ ...config.rule, position: { before: '' } });
    expect(request.mock.calls.some(([, init]) => init.method === 'PUT' || init.method === 'DELETE')).toBe(false);
  });

  it('repairs and moves the managed rule using its existing ID', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(response([zone]))
      .mockResolvedValueOnce(response(ruleset([otherRule, { ...managedRule, enabled: false }])))
      .mockResolvedValueOnce(response(ruleset([managedRule, otherRule])))
      .mockResolvedValueOnce(response(ruleset([managedRule, otherRule])));
    await syncRedirect(options(request));
    const [url, init] = request.mock.calls[2];
    expect(url).toContain('/rulesets/redirect-ruleset/rules/managed-rule');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body).position).toEqual({ before: '' });
  });

  it('does not create a new ruleset version when the rule is already correct', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(response([zone]))
      .mockResolvedValueOnce(response(ruleset([managedRule, otherRule])))
      .mockResolvedValueOnce(response(ruleset([managedRule, otherRule])));
    await syncRedirect(options(request));
    expect(request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });

  it.each([401, 403])('stops without writes when the API denies access (%s)', async status => {
    const request = vi.fn()
      .mockResolvedValueOnce(response([zone]))
      .mockResolvedValueOnce(response(null, status));
    await expect(syncRedirect(options(request))).rejects.toThrow('Single Redirect');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('stops before mutation when the zone belongs to another account', async () => {
    const request = vi.fn().mockResolvedValueOnce(response([{ ...zone, account: { id: 'another-account' } }]));
    await expect(syncRedirect(options(request))).rejects.toThrow('唯一有效');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('rejects a successful write if the saved rule is still missing', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(response([zone]))
      .mockResolvedValueOnce(response(null, 404))
      .mockResolvedValueOnce(response(ruleset([])))
      .mockResolvedValueOnce(response(ruleset([])));
    await expect(syncRedirect(options(request))).rejects.toThrow('规则校验失败');
  });

  it('verify-only rejects a missing rule without trying to create it', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(response([zone]))
      .mockResolvedValueOnce(response(null, 404));
    await expect(syncRedirect({ ...options(request), verifyOnly: true })).rejects.toThrow('规则校验失败');
    expect(request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });
});

describe('live redirect verification', () => {
  it('checks HTTP, HTTPS, assets, encoded paths, repeated query parameters, HEAD and POST without following redirects', async () => {
    const request = vi.fn(async source => {
      const url = new URL(source);
      return new Response(null, { status: 308, headers: { Location: `https://severance.masonhu.org${url.pathname}${url.search}` } });
    });
    await verifyPublicRedirects({ request, attempts: 1 });
    expect(request).toHaveBeenCalledTimes(6);
    expect(request.mock.calls.every(([, init]) => init.redirect === 'manual')).toBe(true);
    expect(request.mock.calls.map(([, init]) => init.method)).toEqual(['GET', 'GET', 'GET', 'GET', 'HEAD', 'POST']);
  });

  it.each([
    [301, 'https://severance.masonhu.org/'],
    [308, 'https://severance.masonhu.org/wrong-path'],
  ])('rejects incorrect redirect responses (%s)', async (status, location) => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status, headers: { Location: location } }));
    await expect(verifyPublicRedirects({ request, attempts: 1 })).rejects.toThrow('预期 308');
  });
});
