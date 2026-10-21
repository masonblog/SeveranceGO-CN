export function createCloudflareApi({ token, accountId, request = fetch, permissionHint = '' }) {
  if (!token || !accountId) throw new Error('缺少 CLOUDFLARE_API_TOKEN 或 CLOUDFLARE_ACCOUNT_ID。');

  return async function api(path, { method = 'GET', body, allowMissing = false } = {}) {
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
      const hint = response.status === 401 || response.status === 403 ? permissionHint : '';
      throw new Error(`Cloudflare API ${method} ${path} 失败（HTTP ${response.status}）：${detail}。${hint}`);
    }
    return data.result;
  };
}
