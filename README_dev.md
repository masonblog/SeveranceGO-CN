# SeveranceGO-CN 开发说明

本文档记录微信小程序版的本地开发、校验和上线前注意事项。

## 本地开发

```bash
corepack pnpm install
corepack pnpm test
corepack pnpm build
```

`corepack pnpm build` 只执行 TypeScript 类型检查。小程序预览、真机调试和上传请使用微信开发者工具打开项目根目录。

## 微信开发者工具

- 项目类型：小程序
- 项目目录：仓库根目录
- AppID：`project.config.json` 默认是 `touristappid`
- 上线前：替换真实 AppID，并确认类目、备案、隐私指引、用户协议等微信公众平台配置

当前版本不使用网络请求，不依赖 Supabase、云开发、登录、订阅消息或支付能力。

## 代码结构

- `app.json`、`app.ts`、`app.wxss`：小程序全局配置和样式
- `pages/index/`：首页表单、交互和结果展示
- `src/lib/calculator.ts`：核心计算逻辑和法律口径版本
- `src/lib/validation.ts`：表单校验
- `src/lib/termination.ts`：离职原因分组和说明
- `src/data/regions.ts`：地区工资数据和来源元信息
- `src/**/*.test.ts`、`src/data/*.test.ts`：Vitest 测试

## 验证要求

- 计算规则变化：更新 `src/lib/calculator.test.ts`
- 地区数据、城市覆盖或来源元信息变化：更新 `src/data/regions.test.ts` 和 `docs/data-sources.md`
- 校验逻辑变化：更新 `src/lib/validation.test.ts`
- 交互或样式变化：运行 `corepack pnpm build`，并在微信开发者工具里手动检查首页流程

## 上线前检查

- `corepack pnpm test` 通过
- `corepack pnpm build` 通过
- 微信开发者工具编译通过
- 真机检查日期、金额、地区、合同和离职原因输入
- 确认页面没有手机号、微信号、咨询提交或第三方网络请求
- 确认免责声明仍清晰可见
