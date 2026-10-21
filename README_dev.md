# SeveranceGO-CN 开发说明

本文档记录本地运行、Supabase 配置和自动部署流程。

## 本地运行

```bash
corepack pnpm install
corepack pnpm dev
```

复制 `.env.example` 为 `.env.local`，填入 Supabase 项目的 URL 和 anon public key：

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

常用命令：

```bash
corepack pnpm test
corepack pnpm build
corepack pnpm deploy:cloudflare
```

## Supabase

在 Supabase SQL Editor 中执行：

```sql
-- supabase/schema.sql
```

该脚本会创建 `severance_submissions` 表，并启用 Row Level Security。匿名用户仅允许插入，不允许公开读取。

脚本还包含基础防滥用措施，如果线上表是旧版本，需要重新执行一次 `supabase/schema.sql`：

- 手机号格式约束：`phone` 非空时必须是中国大陆手机号格式（仅约束新插入的行）。
- 数据库级限速触发器：全表每分钟最多 30 条插入；同一手机号每小时最多 5 条。超限时插入会报错，前端会把错误信息展示给用户。

以上只能挡住简单的脚本刷量。如果垃圾提交明显增多，建议再加验证码（如 Cloudflare Turnstile，需要一个服务端校验入口，例如 Supabase Edge Function）。

提交数据会同时保存两种形态：

- 独立列：入职时间、离职时间、合同信息、收入、地区、解除原因代码、解除原因中文标签、解除原因分组、咨询联系方式等，方便在 Supabase Table Editor 里查看和导出。
- JSON 备份：`form_payload` 保存完整原始表单，`calculation_result` 保存完整计算结果，方便后续排查或二次分析。

如果部署页面提交时报 `rest/v1/severance_submissions 404`，通常表示当前 Supabase 项目还没有执行建表脚本，或 REST API schema cache 尚未刷新。请确认：

- GitHub Actions 中的 `VITE_SUPABASE_URL` 指向的就是你执行 SQL 的同一个 Supabase 项目。
- 在该项目的 SQL Editor 里完整执行 `supabase/schema.sql`，包括 `grant` 和 RLS policy。
- 执行后等待几十秒再刷新部署页面重试；必要时到 Supabase `Project Settings` -> `API` 确认 `public` schema 对 API 暴露。

如果部署页面提交时报 `Could not find the 'article40_no_notice' column of 'severance_submissions' in the schema cache`，表示线上 Supabase 表缺少最新字段，或字段刚添加但 REST API schema cache 还没刷新。处理方式：

```sql
alter table public.severance_submissions
  add column if not exists article40_no_notice boolean not null default false;

notify pgrst, 'reload schema';
```

执行后等待几十秒，再刷新部署页面提交。

环境变量获取位置：

- `VITE_SUPABASE_URL`：Supabase 项目 `Project Settings` -> `API` -> `Project URL`
- `VITE_SUPABASE_ANON_KEY`：Supabase 项目 `Project Settings` -> `API` -> `Project API keys` -> `anon public`

不要把 `service_role` key 放进前端或 GitHub Pages。

## 自动部署

项目已配置 GitHub Actions：

- workflow 文件：`.github/workflows/deploy.yml`
- 触发方式：推送到 `main` 或 `master`，也可手动 `workflow_dispatch`
- 主站：Cloudflare Workers `https://severance.masonhu.org`
- 备用站点：GitHub Pages `https://masonblog.github.io/SeveranceGO-CN/`

纯 Markdown 或 `docs/` 目录变更不会触发站点部署；部署按顺序执行，避免 DNS 迁移中途被后续部署取消。构建产物只生成并上传一次，Cloudflare 与 GitHub Pages 复用同一份产物；Cloudflare 通过 Wrangler 的静态资源清单仅上传缺失或内容变化的文件。

### Cloudflare Workers

Cloudflare Workers 使用 `wrangler.jsonc` 中的 Workers Static Assets 配置部署 `dist`，将未命中的前端路由回退到 `index.html`，仅绑定主站自定义域名 `severance.masonhu.org`。旧域名 `severance.masonhu.cc` 使用独立的 **A 记录 `192.0.2.1`，开启 Cloudflare 代理（橙云），TTL 自动**，由 Cloudflare **单个重定向（Single Redirect）**规则返回 HTTP 308，跳转到新域名的 HTTPS 地址，保留路径和查询参数。

跳转规则定义在 `cloudflare/legacy-redirect.json`。GitHub Actions 在发布 Worker 前运行 `node scripts/sync-cloudflare-redirect.mjs`，通过 Cloudflare 官方 Rulesets API 查询 `masonhu.cc` 的 `http_request_dynamic_redirect` 规则集，并按固定 `ref` 创建或更新本项目规则。脚本只修改本项目的单条规则，将其放在首位，保留其他规则；配置一致时不重复写入。API 失败或配置校验失败会阻止 Worker 部署，现有线上 Worker 保持原样。

Actions 在同步重定向规则后运行 `node scripts/sync-cloudflare-dns.mjs`：先读回规则、Worker 域名绑定和 DNS，确认可访问且规则有效，再解绑旧域名，通过官方 DNS 批量 API 创建或更新代理 A 记录。只处理旧域名的 A/AAAA/CNAME 记录，保留 TXT/MX 和其他域名；DNS 写入失败时尝试恢复原 Worker 绑定。后续执行会跳过已符合配置的记录。

旧域名的 DNS 和 TLS 由 Cloudflare 区域代理及 Universal SSL 提供。`src/worker.ts` 只代理主站静态资源，`assets.run_worker_first` 使用默认值。部署后 Actions 确认旧域名无 Worker 绑定、代理 A 记录正确，并验证 HTTP/HTTPS、首页、静态资源、中文编码路径、重复查询参数及 GET/HEAD/POST 的 308 跳转。`192.0.2.1` 是 Cloudflare 官方建议的无源站跳转占位地址，请保持代理开启。

配置依据见 Cloudflare 的[域名跳转与代理 DNS](https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/)、[通过 API 创建重定向规则](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/create-api/)及[解绑 Worker 域名 API](https://developers.cloudflare.com/api/resources/workers/subresources/domains/methods/delete/)。

你需要在 GitHub 仓库中手动完成：

1. `masonhu.org` 和 `masonhu.cc` 均已托管在同一个 Cloudflare 账号，并且当前账号有权限管理这两个 zone。保留旧域名的区域托管、代理 DNS 及 Universal SSL。
2. GitHub 仓库 `Settings` -> `Secrets and variables` -> `Actions` 中新增：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. `CLOUDFLARE_API_TOKEN` 需要以下权限：

   | 范围 | 权限 | 级别 | 资源 |
   | --- | --- | --- | --- |
   | 账户 | Workers 脚本（Workers Scripts） | 编辑 | 部署账户 |
   | 区域 | Workers 路由（Workers Routes） | 编辑 | `masonhu.org`、`masonhu.cc` |
   | 区域 | 区域（Zone） | 读取 | `masonhu.org`、`masonhu.cc` |
   | 区域 | 单个重定向（Single Redirect；API 权限名 Dynamic URL Redirects Write） | 编辑 | `masonhu.cc` |
   | 区域 | DNS | 编辑 | `masonhu.cc` |

   Workers Scripts 编辑权限用于迁移时解绑旧自定义域名；DNS 编辑权限用于管理独立代理 A 记录。令牌保存在 GitHub Actions secret 中，API 调用只在 Actions 内执行。

### GitHub Pages

你需要在 GitHub 仓库中手动完成：

1. `Settings` -> `Pages` -> `Build and deployment`，将 `Source` 设为 `GitHub Actions`。
2. `Settings` -> `Secrets and variables` -> `Actions`，新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 确认 Supabase 已执行 `supabase/schema.sql`，并且 RLS 插入策略存在。

注意：这两个值需要配置为仓库级 `Repository secrets`。如果只配置在 GitHub Pages environment 里，构建步骤可能读取不到，页面提交时会出现 `No API key found in request`。

完成后，推送到 `main` 或 `master` 会同时部署：

- Cloudflare Workers 主站：`https://severance.masonhu.org`（旧域名 `https://severance.masonhu.cc` 永久跳转到主站）
- GitHub Pages 备用站点：`https://masonblog.github.io/SeveranceGO-CN/`

如果 Cloudflare secrets 尚未配置，Cloudflare job 会跳过，GitHub Pages 备用站点仍会正常部署。
