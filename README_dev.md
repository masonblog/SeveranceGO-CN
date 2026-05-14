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
