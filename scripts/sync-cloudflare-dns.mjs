import { pathToFileURL } from 'node:url';
import { createCloudflareApi } from './cloudflare-api.mjs';
import { config, syncRedirect } from './sync-cloudflare-redirect.mjs';

const permissionHint = '请核对 masonhu.cc 的 DNS 编辑、区域读取、单个重定向编辑，以及账户的 Workers Scripts 编辑权限。';
const isAddressRecord = record => ['A', 'AAAA', 'CNAME'].includes(record.type);
const recordMatches = record => record && Object.entries(config.dns_record).every(([key, value]) => record[key] === value);

export async function syncLegacyDns({ token, accountId, request = fetch, verifyOnly = false }) {
  const api = createCloudflareApi({ token, accountId, request, permissionHint });
  // Do not detach the hostname until its edge redirect is already configured.
  const { zoneId } = await syncRedirect({ token, accountId, request, verifyOnly: true });
  const hostname = config.dns_record.name;
  const domainsPath = `/accounts/${accountId}/workers/domains`;
  const domainsQuery = `${domainsPath}?${new URLSearchParams({ hostname })}`;
  const dnsPath = `/zones/${zoneId}/dns_records`;
  const dnsQuery = `${dnsPath}?${new URLSearchParams({ name: hostname, per_page: '100' })}`;
  const getDomains = async () => (await api(domainsQuery)).filter(domain => domain.hostname === hostname);
  const getRecords = async () => (await api(dnsQuery)).filter(record => record.name === hostname && isAddressRecord(record));

  const domains = await getDomains();
  // Read DNS before any detach so inaccessible zones fail without changing routing.
  let records = await getRecords();
  if (domains.length > 1 || domains.some(domain => domain.service !== config.worker_name || domain.zone_id !== zoneId)) {
    throw new Error('旧域名存在不属于当前项目的 Worker 绑定，停止自动解绑。');
  }

  if (!verifyOnly) {
    const original = domains[0];
    if (original) {
      await api(`${domainsPath}/${original.id}`, { method: 'DELETE' });
      console.log(`已解除 ${hostname} 的 Worker 自定义域名绑定。`);
    }

    try {
      if (original) records = await getRecords();
      if (records.length !== 1 || !recordMatches(records[0])) {
        const existing = records.find(record => record.type === config.dns_record.type) ?? records[0];
        // DNS batch writes are transactional; preserve TXT/MX and other hostnames.
        await api(`${dnsPath}/batch`, {
          method: 'POST',
          body: {
            deletes: records.filter(record => record.id !== existing?.id).map(({ id }) => ({ id })),
            ...(existing
              ? { puts: [{ id: existing.id, ...config.dns_record }] }
              : { posts: [config.dns_record] }),
          },
        });
      }
    } catch (error) {
      if (original) {
        try {
          await api(domainsPath, {
            method: 'PUT',
            body: {
              hostname,
              service: original.service,
              environment: original.environment ?? 'production',
              zone_id: zoneId,
              enabled: original.enabled ?? true,
              ...(original.previews_enabled === undefined ? {} : { previews_enabled: original.previews_enabled }),
            },
          });
        } catch (rollbackError) {
          throw new Error(`DNS 迁移失败且恢复 Worker 绑定失败：${error.message}；${rollbackError.message}`);
        }
        throw new Error(`DNS 迁移失败，已恢复原 Worker 绑定：${error.message}`);
      }
      throw error;
    }
  }

  const remainingDomains = await getDomains();
  const savedRecords = await getRecords();
  if (remainingDomains.length !== 0 || savedRecords.length !== 1 || !recordMatches(savedRecords[0])) {
    throw new Error('旧域名校验失败：必须没有 Worker 绑定，且仅保留本项目的代理 A 记录。');
  }
  console.log(`已确认 ${hostname} 无 Worker 绑定；DNS 为 ${config.dns_record.type} ${config.dns_record.content}，Cloudflare 代理已开启。`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  try {
    await syncLegacyDns({ token, accountId: process.env.CLOUDFLARE_ACCOUNT_ID, verifyOnly: process.argv.includes('--verify-only') });
  } catch (error) {
    console.error(token ? error.message.replaceAll(token, '[REDACTED]') : error.message);
    process.exitCode = 1;
  }
}
