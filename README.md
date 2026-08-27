# Quantumult X 去广分流与重写规则

> **仅供仓库所有者个人、非商业使用。保留所有权利。**
>
> 未经书面许可，禁止复制、修改、转载、镜像、再分发、转售或创建衍生版本。本仓库不是开源项目，不接受外部贡献。公开 GitHub 仓库在技术上仍可被查看、下载、克隆或 Fork；公开可见不代表获得使用许可。

这是从个人 Quantumult X 配置脱敏整理出的公开只读规则仓库。目标是持续研究公开的去广分流与重写资源，同时保持低误杀、最小 MitM 范围和可回滚性。只有 `000Robin` 拥有仓库写权限。

## Quantumult X 引用

### 去广分流

```ini
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/managed-filter.list, tag=Robin个人维护去广分流, update-interval=259200, opt-parser=false, inserted-resource=true, enabled=true
```

该文件同时包含 `direct` 修正和 `reject` 规则，必须放在大型去广列表之前，且**不要设置 `force-policy`**。

### 去广重写

```ini
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/managed-rewrite.snippet, tag=Robin个人维护去开屏, update-interval=259200, opt-parser=false, enabled=true
```

两个公开 Raw 文件只包含精确直连修正、已验证的广告拒绝规则和最小 hostname，不包含 MitM 私钥、订阅、Cookie、Token 或会员解锁脚本。腾讯视频应用内弹窗由 `scripts/tencent_video_popup_clean.js` 处理：仅净化 `i.video.qq.com` 根接口 JSON 中明确标记的广告容器与节点，解析失败时原样放行。

## 建议启用结构

1. 先加载 `dist/managed-filter.list`，保护中国电信登录、抖音安全验证和 12306 稳定性。
2. 分流修正列表按需选择一个，不要无差别叠加。
3. 主去广分流只选一个：轻量可测试 AWAvenue，中量可用 fmz200，覆盖优先可继续使用 Cats-Team；不建议再叠加 blackmatrix7 超大型列表。
4. 重写层保留 `dist/managed-rewrite.snippet`，再按实际安装的 App 选择专用重写；不要同时启用多个相同大型合集的 Raw/CDN 镜像。

候选 URL、快照规模、冲突和采用判断见 `sources/filter-candidates.conf` 与 `sources/filter-source-audit.md`。

## 当前基线

- 远程重写源：54 条（38 条启用、16 条停用）。
- 2026-08-19 首次审计：46 条可直接读取，5 条上游返回 404，3 条受站点 403 保护。
- 7 条带“开屏/startup/startingad”标记的远程源已冻结在 `rules/protected-splash-baseline.conf`。
- 原配置中与启动广告直接相关的本地拒绝规则已摘录到 `rules/protected-local-splash.conf`。
- 4 条精确直连与 3 条连接层拒绝已冻结在 `rules/protected-filter-baseline.conf`。
- 新发现只进入重写或分流候选文件，默认停用，不得自动覆盖、禁用或删除保护基线。

## 文件说明

- `sources/all-rewrite-sources.conf`：原配置的全部 54 条远程重写引用，保留原启停状态。
- `sources/source-audit.md`：来源可达性、重复项、风险和不可复制内容摘录。
- `rules/protected-splash-baseline.conf`：不可被定时任务改写的去开屏远程基线。
- `rules/protected-local-splash.conf`：不可被定时任务改写的本地开屏拒绝规则。
- `rules/protected-filter-baseline.conf`：关键直连修正与连接层拒绝基线。
- `sources/candidates.conf`：定时研究发现的重写候选，默认停用。
- `sources/filter-candidates.conf`：已审计的分流候选，主去广列表只能择一测试。
- `sources/filter-source-audit.md`：分流来源规模、重复、顺序和误杀风险审计。
- `dist/managed-filter.list`：供 Quantumult X 引用的精简去广分流与修正列表。
- `dist/managed-rewrite.snippet`：供 Quantumult X 引用的公开、脱敏重写片段。
- `scripts/tencent_video_popup_clean.js`：腾讯视频应用内弹窗/广告卡片的保守 JSON 净化脚本，不处理会员或正片播放接口。
- `logs/discovery-log.md`：每次研究的来源、判断与变更记录。
- `automation/PROMPT.md`：每三天任务的执行边界。
- `tools/validate_rules.py`：本地与 GitHub Actions 共用的语法、顺序和敏感信息检查。

## 安全边界

仓库永远不得包含 MitM 证书、证书密码、机场订阅、GitHub 令牌、Cookie、登录态或设备标识。带“会员/VIP/RevenueCat/订阅解锁/Cookie 获取”等功能的来源仅保留为原始目录记录，不得自动合并到广告基线。提交前运行 `python tools/validate_rules.py`。

完整权利和第三方归属说明见 `LICENSE` 与 `NOTICE.md`。公开仓库不需要也不得在 Quantumult X URL 中加入 GitHub Token。
