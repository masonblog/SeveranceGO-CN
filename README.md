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
- 内置 2024 年工资标准参考数据，并在页面展示来源和口径说明。
- 结果按区间和明细展示，包括 N、2N、N+1、未签合同二倍工资等。
- GitHub Actions 自动构建并部署到 GitHub Pages。

## 表单填写教程

1. 填写职业信息：输入实际入职时间、离职或预计离职时间、上一自然年度总收入，并选择劳动合同履行地。
2. 核对地区工资口径：系统会按所选地区自动带出上年度职工月平均工资和月最低工资。若你掌握仲裁、法院或当地最新公布口径，可在“可覆盖”输入框中手动填写。
3. 填写合同信息：选择是否已签书面劳动合同；如果已签，请填写书面合同签订时间。未签书面合同时，系统会同步估算可能涉及的二倍工资区间。
4. 选择离职情况：按实际原因选择协商一致、无过失性解除、经济性裁员、疑似违法解除、主动辞职、被迫解除、重大违纪、合同到期终止或其他不确定情形。若选择“被迫解除”，建议补充欠薪、未缴社保、违法调岗降薪等具体原因。
5. 勾选争议因素：如存在重大违纪争议、调岗降薪、批量裁员，或第 40 条解除且未提前 30 日通知，请勾选对应选项；这些信息会影响风险提示和 N+1 判断。
6. 选择是否需要免费法律咨询：如果选择“需要咨询”，手机号为必填；微信号和咨询说明可补充公司解除理由、通知书、欠薪或社保问题等线索。
7. 点击“提交并查看计算结果”：表单通过校验后，右侧会展示预计一次性金额区间、工作年限、补偿月数、计算明细、适用规则、风险提示和建议核查事项。

## 开发与部署

本地运行、Supabase 配置和 GitHub Pages 自动部署说明已移至 [README_dev.md](README_dev.md)。

## 数据口径

地区工资数据说明见 `docs/data-sources.md`。

当前城市选项已覆盖中国大陆各省级行政区下的地级行政区、自治州、地区、盟及部分省直管县级行政单位。对于未公开统一城市级 2024 平均工资的城市，项目暂用国家统计局 2024 分区域官方工资口径作为封顶参考；最低工资默认使用省级一档或已确认城市档位。

## 法律提示

本工具只用于初步估算和线索收集，不构成法律意见。地区工资数据、司法口径、解除理由、证据材料和程序事实都会影响最终结果，正式使用前应复核城市数据与最新法规。
