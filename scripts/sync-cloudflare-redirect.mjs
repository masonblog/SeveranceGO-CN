import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export const config = JSON.parse(readFileSync(new URL('../cloudflare/legacy-redirect.json', import.meta.url), 'utf8'));
const permissionHint = '请给 CLOUDFLARE_API_TOKEN 增加 masonhu.cc 的“区域 → 单个重定向（Single Redirect）→ 编辑”和“区域 → 区域 → 读取”权限。';

function ruleMatches(rule) {
  return rule && Object.entries(config.rule).every(([key, value]) => isDeepStrictEqual(rule[key], value));
}

export async function syncRedirect({ token, accountId, request = fetch, verifyOnly = false }) {
  if (!token || !accountId) throw new Error('缺少 CLOUDFLARE_API_TOKEN 或 CLOUDFLARE_ACCOUNT_ID。');

  async function api(path, { method = 'GET', body, allowMissing = false } = {}) {
    const response = await request(`https://api.cloudflare.com/client/v4${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json();
    if (allowMissing && response.status === 404 && data.success === false) return null;
    if (!response.ok || data.success !== true) {
      const detail = (data.errors ?? []).map(({ code, message }) => `${code}: ${message}`).join('; ');
      throw new Error(`Cloudflare API ${method} ${path} 失败（HTTP ${response.status}）：${detail}。${permissionHint}`);
    }
    return data.result;
  }

  const query = new URLSearchParams({ name: config.zone_name, 'account.id': accountId, status: 'active' });
  const zones = await api(`/zones?${query}`);
  if (zones.length !== 1 || zones[0].name !== config.zone_name || zones[0].account.id !== accountId) {
    throw new Error(`未找到当前账户中唯一有效的 ${config.zone_name} 区域。${permissionHint}`);
  }

  const base = `/zones/${zones[0].id}/rulesets`;
  const entrypoint = `${base}/phases/${config.phase}/entrypoint`;
  let ruleset = await api(entrypoint, { allowMissing: true });
  const matches = (ruleset?.rules ?? []).filter(({ ref }) => ref === config.rule.ref);
  if (matches.length > 1) throw new Error('发现多个同名托管重定向规则，请先消除重复规则。');
  const existing = matches[0];

  if (!verifyOnly) {
    if (!ruleset) {
      await api(base, {
        method: 'POST',
        body: { name: 'Redirect rules', kind: 'zone', phase: config.phase, rules: [config.rule] },
      });
    } else if (!ruleMatches(existing) || ruleset.rules[0]?.id !== existing?.id) {
      // Only change our rule; a full ruleset PUT would replace unrelated rules.
      await api(`${base}/${ruleset.id}/rules${existing ? `/${existing.id}` : ''}`, {
        method: existing ? 'PATCH' : 'POST',
        body: { ...config.rule, position: { before: '' } },
      });
    }
    ruleset = await api(entrypoint);
  }

  if (!ruleMatches(ruleset?.rules?.[0])) {
    throw new Error('Cloudflare 规则校验失败：托管重定向规则未位于首位或配置不一致，停止后续部署。');
  }
  console.log('已确认 Cloudflare 单个重定向：severance.masonhu.cc → https://severance.masonhu.org，308，保留路径和查询参数。');
}

export async function verifyPublicRedirects({ request = fetch, attempts = 5 } = {}) {
  const cases = [
    ['GET', 'http://severance.masonhu.cc/'],
    ['GET', 'https://severance.masonhu.cc/'],
    ['GET', 'https://severance.masonhu.cc/assets/redirect-check.js'],
    ['GET', 'https://severance.masonhu.cc/estimate/%E4%B8%8A%E6%B5%B7?from=legacy&tag=a&tag=b'],
    ['HEAD', 'https://severance.masonhu.cc/?from=legacy'],
    ['POST', 'https://severance.masonhu.cc/?from=legacy'],
  ];
  for (const [method, source] of cases) {
    const target = new URL(source);
    target.protocol = 'https:';
    target.hostname = 'severance.masonhu.org';
    let failure;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await request(source, { method, redirect: 'manual', signal: AbortSignal.timeout(10_000) });
        const location = response.headers.get('Location');
        await response.body?.cancel();
        if (response.status !== 308 || location !== target.href) {
          throw new Error(`${method} ${source} 预期 308 → ${target.href}，实际 ${response.status} → ${location}`);
        }
        failure = undefined;
        break;
      } catch (error) {
        failure = error;
        if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 3_000));
      }
    }
    if (failure) throw failure;
    console.log(`线上校验通过：${method} ${source}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const verifyOnly = process.argv.includes('--verify-only');
  try {
    await syncRedirect({ token, accountId: process.env.CLOUDFLARE_ACCOUNT_ID, verifyOnly });
    if (verifyOnly) await verifyPublicRedirects();
  } catch (error) {
    console.error(token ? error.message.replaceAll(token, '[REDACTED]') : error.message);
    process.exitCode = 1;
  }
}
