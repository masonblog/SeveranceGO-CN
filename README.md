# SeveranceGO-CN | 中国离职补偿金计算工具

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Pages-2088ff?logo=githubactions&logoColor=white)

项目基于《劳动合同法》《劳动合同法实施条例》及劳动争议司法解释的常见规则，估算经济补偿金、违法解除赔偿金、代通知金和未签书面劳动合同二倍工资。

工具直达：[https://masonblog.github.io/SeveranceGO-CN/](https://masonblog.github.io/SeveranceGO-CN/)

## 功能

- 单页响应式表单，提交后展示计算结果。
- 必填项校验，免费法律咨询选择“需要”时手机号必填。
- 劳动合同履行地支持省市两级联动选择。
- 内置 2024 年工资标准参考数据，并在页面展示来源和口径说明。
- 结果按区间和明细展示，包括 N、2N、N+1、未签合同二倍工资等。
- 表单内容和计算结果写入 Supabase `severance_submissions` 表。
- GitHub Actions 自动构建并部署到 GitHub Pages。

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

## 数据口径

地区工资数据说明见 `docs/data-sources.md`。

当前城市选项已覆盖中国大陆各省级行政区下的地级行政区、自治州、地区、盟及部分省直管县级行政单位。对于未公开统一城市级 2024 平均工资的城市，项目暂用国家统计局 2024 分区域官方工资口径作为封顶参考；最低工资默认使用省级一档或已确认城市档位。

## 法律提示

本工具只用于初步估算和线索收集，不构成法律意见。地区工资数据、司法口径、解除理由、证据材料和程序事实都会影响最终结果，正式使用前应复核城市数据与最新法规。
