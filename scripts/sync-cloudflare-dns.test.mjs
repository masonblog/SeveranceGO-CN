import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from './sync-cloudflare-redirect.mjs';
import { syncLegacyDns } from './sync-cloudflare-dns.mjs';

const domain = { id: 'legacy-domain', hostname: 'severance.masonhu.cc', service: 'severancego-cn', zone_id: 'legacy-zone', environment: 'production', enabled: true };
const mainDomain = { id: 'main-domain', hostname: 'severance.masonhu.org', service: 'severancego-cn', zone_id: 'main-zone' };
const desiredRecord = { id: 'redirect-dns', ...config.dns_record };
const txtRecord = { id: 'keep-txt', name: 'severance.masonhu.cc', type: 'TXT', content: 'keep-verification' };
const otherRecord = { id: 'keep-other', name: 'other.masonhu.cc', type: 'A', content: '192.0.2.5' };

function mockCloudflare({ domains = [domain, mainDomain], records = [txtRecord, otherRecord], ruleEnabled = true, denyDnsRead = false, denyDnsWrite = false } = {}) {
  const state = structuredClone({ domains, records });
  const request = vi.fn(async (url, init) => {
    const path = new URL(url).pathname.replace('/client/v4', '');
    const body = init.body ? JSON.parse(init.body) : undefined;
    let result;
    let status = 200;
    if (init.method === 'GET' && path === '/zones') {
      result = [{ id: 'legacy-zone', name: 'masonhu.cc', account: { id: 'account' } }];
    } else if (init.method === 'GET' && path.endsWith('/rulesets/phases/http_request_dynamic_redirect/entrypoint')) {
      result = { id: 'ruleset', rules: [{ id: 'redirect-rule', ...config.rule, enabled: ruleEnabled }] };
    } else if (init.method === 'GET' && path === '/accounts/account/workers/domains') {
      result = state.domains;
    } else if (init.method === 'GET' && path === '/zones/legacy-zone/dns_records') {
      result = state.records;
      if (denyDnsRead) status = 403;
    } else if (init.method === 'DELETE' && path === '/accounts/account/workers/domains/legacy-domain') {
      state.domains = state.domains.filter(item => item.id !== domain.id);
      state.records = state.records.filter(item => item.id !== 'worker-managed-dns');
    } else if (init.method === 'POST' && path === '/zones/legacy-zone/dns_records/batch') {
      if (denyDnsWrite) {
        status = 403;
      } else {
        for (const { id } of body.deletes) state.records = state.records.filter(item => item.id !== id);
        for (const record of body.puts ?? []) {
          state.records = state.records.map(item => item.id === record.id ? record : item);
        }
        for (const record of body.posts ?? []) state.records.push({ id: 'redirect-dns', ...record });
      }
    } else if (init.method === 'PUT' && path === '/accounts/account/workers/domains') {
      state.domains.push({ id: domain.id, ...body });
    } else {
      throw new Error(`Unexpected request: ${init.method} ${path}`);
    }
    return new Response(JSON.stringify({ success: status === 200, result, errors: status === 200 ? [] : [{ code: 10000, message: 'Authentication error' }] }), { status });
  });
  return { state, request, options: { token: 'test-token', accountId: 'account', request } };
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('legacy hostname DNS migration', () => {
  it('verifies the edge rule before detaching, creates a proxied A record, and preserves the primary domain and other DNS records', async () => {
    const api = mockCloudflare({ records: [{ id: 'worker-managed-dns', name: domain.hostname, type: 'CNAME', content: 'worker.example.com' }, txtRecord, otherRecord] });
    await syncLegacyDns(api.options);
    expect(api.state.domains).toEqual([mainDomain]);
    expect(api.state.records).toEqual([txtRecord, otherRecord, desiredRecord]);
    expect(desiredRecord).toMatchObject({ type: 'A', content: '192.0.2.1', proxied: true, ttl: 1 });
    const calls = api.request.mock.calls;
    const ruleCheck = calls.findIndex(([url]) => url.includes('/rulesets/phases/'));
    const detach = calls.findIndex(([, init]) => init.method === 'DELETE');
    const dnsWrite = calls.findIndex(([url, init]) => init.method === 'POST' && url.endsWith('/dns_records/batch'));
    expect(ruleCheck).toBeLessThan(detach);
    expect(detach).toBeLessThan(dnsWrite);
  });

  it('is read-only when already migrated', async () => {
    const api = mockCloudflare({ domains: [mainDomain], records: [desiredRecord, txtRecord, otherRecord] });
    await syncLegacyDns(api.options);
    expect(api.request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });

  it('normalizes conflicting address records in one DNS batch without deleting TXT or other hostnames', async () => {
    const api = mockCloudflare({ domains: [mainDomain], records: [
      { id: 'old-a', name: domain.hostname, type: 'A', content: '192.0.2.5', proxied: false },
      { id: 'old-aaaa', name: domain.hostname, type: 'AAAA', content: '100::', proxied: true },
      txtRecord, otherRecord,
    ] });
    await syncLegacyDns(api.options);
    expect(api.state.records).toEqual([{ ...config.dns_record, id: 'old-a' }, txtRecord, otherRecord]);
    const [, init] = api.request.mock.calls.find(([url]) => url.endsWith('/dns_records/batch'));
    expect(JSON.parse(init.body).deletes).toEqual([{ id: 'old-aaaa' }]);
  });

  it('does not detach when the edge rule is disabled', async () => {
    const api = mockCloudflare({ ruleEnabled: false });
    await expect(syncLegacyDns(api.options)).rejects.toThrow('规则校验失败');
    expect(api.request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });

  it('does not detach when DNS is unreadable', async () => {
    const api = mockCloudflare({ denyDnsRead: true });
    await expect(syncLegacyDns(api.options)).rejects.toThrow('DNS 编辑');
    expect(api.state.domains).toEqual([domain, mainDomain]);
    expect(api.request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });

  it('refuses to detach a binding owned by another Worker', async () => {
    const api = mockCloudflare({ domains: [{ ...domain, service: 'another-worker' }] });
    await expect(syncLegacyDns(api.options)).rejects.toThrow('不属于当前项目');
    expect(api.request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });

  it('restores the original binding if the DNS write fails', async () => {
    const api = mockCloudflare({ denyDnsWrite: true });
    await expect(syncLegacyDns(api.options)).rejects.toThrow('已恢复原 Worker 绑定');
    expect(api.state.domains).toContainEqual(domain);
    expect(api.state.domains).toContainEqual(mainDomain);
    expect(api.request.mock.calls.at(-1)[1].method).toBe('PUT');
  });

  it('verify-only accepts standalone DNS without writes', async () => {
    const api = mockCloudflare({ domains: [mainDomain], records: [desiredRecord, txtRecord] });
    await syncLegacyDns({ ...api.options, verifyOnly: true });
    expect(api.request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });

  it.each([
    { domains: [domain, mainDomain], records: [desiredRecord] },
    { domains: [mainDomain], records: [{ ...desiredRecord, proxied: false }] },
    { domains: [mainDomain], records: [{ ...desiredRecord, content: '192.0.2.5' }] },
  ])('verify-only rejects remaining bindings or incorrect DNS', async state => {
    const api = mockCloudflare(state);
    await expect(syncLegacyDns({ ...api.options, verifyOnly: true })).rejects.toThrow('旧域名校验失败');
    expect(api.request.mock.calls.every(([, init]) => init.method === 'GET')).toBe(true);
  });
});
