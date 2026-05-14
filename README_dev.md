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
```

## Supabase

在 Supabase SQL Editor 中执行：

```sql
-- supabase/schema.sql
```

该脚本会创建 `severance_submissions` 表，并启用 Row Level Security。匿名用户仅允许插入，不允许公开读取。

提交数据会同时保存两种形态：

- 独立列：入职时间、离职时间、合同信息、收入、地区、解除原因、咨询联系方式等，方便在 Supabase Table Editor 里查看和导出。
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
- 部署目标：GitHub Pages

你需要在 GitHub 仓库中手动完成：

1. `Settings` -> `Pages` -> `Build and deployment`，将 `Source` 设为 `GitHub Actions`。
2. `Settings` -> `Secrets and variables` -> `Actions`，新增：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 确认 Supabase 已执行 `supabase/schema.sql`，并且 RLS 插入策略存在。
