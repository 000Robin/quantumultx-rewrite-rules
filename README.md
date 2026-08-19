# Quantumult X 重写规则（私有）

这是从 `quantumult_20260819091942.conf` 脱敏整理出的私有规则仓库。目标是持续研究公开的 Quantumult X 重写资源，同时不破坏当前去开屏广告能力。

## 当前基线

- 远程重写源：54 条（38 条启用、16 条停用）。
- 2026-08-19 首次审计：46 条可直接读取，5 条上游返回 404，3 条受站点 403 保护。
- 7 条带“开屏/startup/startingad”标记的远程源已冻结在 `rules/protected-splash-baseline.conf`。
- 原配置中与启动广告直接相关的本地拒绝规则已摘录到 `rules/protected-local-splash.conf`。
- 新发现只进入 `sources/candidates.conf`，不得自动覆盖、禁用或删除保护基线。

## 文件说明

- `sources/all-rewrite-sources.conf`：原配置的全部 54 条远程重写引用，保留原启停状态。
- `sources/source-audit.md`：来源可达性、重复项、风险和不可复制内容摘录。
- `rules/protected-splash-baseline.conf`：不可被定时任务改写的去开屏远程基线。
- `rules/protected-local-splash.conf`：不可被定时任务改写的本地开屏拒绝规则。
- `sources/candidates.conf`：定时研究发现的候选规则，默认停用。
- `logs/discovery-log.md`：每次研究的来源、判断与变更记录。
- `automation/PROMPT.md`：每三天任务的执行边界。

## 安全边界

仓库永远不得包含 MitM 证书、证书密码、机场订阅、GitHub 令牌、Cookie、登录态或设备标识。带“会员/VIP/RevenueCat/订阅解锁/Cookie 获取”等功能的来源仅保留为原始目录记录，不得自动合并到广告基线。

本仓库保持私有。不要把私有仓库令牌拼进 Quantumult X URL；如需在设备上使用，请通过安全的私有文件同步方式导入。
