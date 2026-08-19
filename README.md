# Quantumult X 重写规则

> **仅供仓库所有者个人、非商业使用。保留所有权利。**
>
> 未经书面许可，禁止复制、修改、转载、镜像、再分发、转售或创建衍生版本。本仓库不是开源项目，不接受外部贡献。公开 GitHub 仓库在技术上仍可被查看、下载、克隆或 Fork；公开可见不代表获得使用许可。

这是从 `quantumult_20260819091942.conf` 脱敏整理出的公开只读规则仓库。目标是持续研究公开的 Quantumult X 重写资源，同时不破坏当前去开屏广告能力。只有 `000Robin` 拥有仓库写权限。

## Quantumult X 引用

```ini
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/managed-rewrite.snippet, tag=Robin个人维护去开屏, update-interval=259200, opt-parser=false, enabled=true
```

该公开 raw 片段只包含已验证的广告拒绝规则，不包含 MitM 私钥、订阅、Cookie、Token 或会员解锁脚本。

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
- `dist/managed-rewrite.snippet`：供 Quantumult X 引用的公开、脱敏重写片段。
- `logs/discovery-log.md`：每次研究的来源、判断与变更记录。
- `automation/PROMPT.md`：每三天任务的执行边界。

## 安全边界

仓库永远不得包含 MitM 证书、证书密码、机场订阅、GitHub 令牌、Cookie、登录态或设备标识。带“会员/VIP/RevenueCat/订阅解锁/Cookie 获取”等功能的来源仅保留为原始目录记录，不得自动合并到广告基线。

完整权利和第三方归属说明见 `LICENSE` 与 `NOTICE.md`。公开仓库不需要也不得在 Quantumult X URL 中加入 GitHub Token。
