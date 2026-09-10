# 去广分流来源审计（2026-08-26）

## 结论

Quantumult X 的去广分流应采用“精确直连修正 + 一个主去广列表”的结构。多个大型列表叠加会重复匹配、增加内存与更新流量，并放大误杀；不应把规则数量当成拦截质量。

官方示例将 `[filter_remote]` 与 `[rewrite_remote]` 分开；`force-policy` 会覆盖远程分流文件内原有策略。因此 `dist/managed-filter.list` 同时包含 `direct` 与 `reject`，导入时绝不能添加 `force-policy`。

## 主去广列表对比

| 来源 | 2026-08-26 快照 | 规模 | 判断 |
| --- | --- | ---: | --- |
| AWAvenue Quantumult X | `9f5bc853` / v1.7.6 | 902 行，31,765 B | 体积小、格式明确，适合作为低开销候选；需 `opt-parser=true`。 |
| fmz200 `filter.list` | `7fb19fa1` | 123,444 B | 中等规模，和其 `filterFix.list` 配套较自然；当前个人配置存在重复入口。 |
| Cats-Team `qx.conf` | `616fa398` | 7,829,399 B | 覆盖广告、跟踪、恶意域名、HTTPDNS、PCDN；覆盖广但误杀和资源开销更高。 |
| blackmatrix7 Advertising | `2df6b08d` | 11,982,485 B；上游统计 279,882 条 | 超大型生成列表，上游明确提示可能误拦截；不应与 Cats-Team 同时启用。 |
| 217heidai Quantumult X Lite | `7405f810` / `20260910204948` | 5,323 条，205,590 B | 仅国内域名；相对完整版本显著精简，但仍需放在直连修正之后并单独测试。 |
| 217heidai Quantumult X Full | `7405f810` / `20260910204948` | 214,643 条，8,522,393 B | 多上游聚合且每 8 小时更新；覆盖极广，存在共享服务误杀，不适合与其他主列表叠加。 |

以上只登记上游 URL、版本和统计，不复制第三方完整规则正文。候选全部保持 `enabled=false`。

## 分流修正来源

- `fmz200/filterFix.list`：3,884 B，包含 Apple、腾讯、友盟、携程等直连修正；适合放在主去广列表之前，但其中的宽泛直连项应按实际 App 需求保留。
- `ddgksf2013/Unbreak.list`：1,169 B，最后标记更新时间为 2024-10-22；体积小但更新较旧，可作为备用，不建议与前者无差别叠加。
- 本仓库 `dist/managed-filter.list`：只保留本次已知必要的 4 条精确直连和 3 条腾讯视频拒绝，作为最小自维护层。

## 当前配置的重复与冲突

从本次提供的配置看，至少存在以下重复：

1. `fmz200/QuantumultX/filter/filter.list` 以两种 GitHub URL 启用了两次。
2. `fmz200/QuantumultX/rewrite/rewrite.snippet` 以两种 GitHub URL 启用了两次。
3. blackmatrix7 Advertising 重写同时启用了 jsDelivr 与 GitHub Raw 镜像。
4. 多个大型开屏/广告合集同时启用，规则和 MitM hostname 高度重叠。

建议保留一个规范 Raw URL，其余镜像只作停用备用。受保护的历史开屏基线暂不自动删减，后续应按 App 逐项 A/B 测试后手动精简。

## 高优先级安全项

1. 中国电信：重写正则与 MitM 都收紧到 `wapside.189.cn`，并对 `appgologinhd.189.cn`、`appgologin.189.cn` 保持直连/排除。
2. 抖音：只直连 `vcs-lf.zijieapi.com` 安全验证；整段直连 `douyin.com`、`snssdk.com`、`zijieapi.com` 会让去广列表失效。
3. `*.ctyun.cn` 属于宽 MitM 风险，已从默认管理片段隔离；原始保护参考仍保留，取得新 HAR 并定位实际广告主机后再以精确 hostname 恢复。
4. 不启用 `hostname=*`，不因广告规则关闭证书校验，不把 Cookie、Token、订阅或 MitM 私钥写入仓库。

## 2026-09-08 增量复核

- AWAvenue Quantumult X 仍为 v1.7.6，902 行、31,765 B，当前提交 `9f5bc853`；没有需要迁移或替换的低开销主列表。
- Cats-Team `qx.conf` 已更新为 blob `08428d5d`，当前 7,804,760 B，较上次审计快照减少 24,639 B。该列表仍覆盖广告、跟踪、恶意域名、HTTPDNS 与 PCDN，体积和误杀面较大，继续保持 `enabled=false`。
- blackmatrix7 Advertising 已更新至提交 `0700cb25`，上游统计 283,593 条，较上次审计记录增加 3,711 条。上游仍明确提示可能误拦截，并建议该列表单独使用，因此继续保持 `enabled=false`，不与 Cats-Team 叠加。
- 本轮没有新增分流候选、确认迁移或运行配置变更；`dist/`、图标链接和受保护规则均未修改。

## 2026-09-10 — 217heidai Quantumult X 来源审计

- 上游仓库采用 GPL-3.0，说明其每 8 小时合并、去重并通过多组 DNS 剔除无法解析域名；本轮读取提交 `7405f810`，Full 与 Lite 版本号均为 `20260910204948`。
- 语法：Full 版 214,643 条、8,522,393 B；Lite 版 5,323 条、205,590 B。活动规则全部为 Quantumult X 可识别的 `host-suffix,<domain>,reject`，字段数正确，未发现重复活动行。
- 去重关系：Lite 与 AWAvenue v1.7.6 的 949 个域名/关键词字面项重合 501 个；Lite 另有 4,822 个字面域名。两者不能据此判定语义完全包含，但已经证明不应叠加作为两个主去广列表。
- 冲突：Full 与 Lite 都包含 `ad.12306.cn,reject`，会与本仓库用于合法空响应脚本的 `direct` 修正规则冲突；Full 还包含 `api.statsig.com` 与 Apple DoH/分析等共享服务，可能影响 ChatGPT 功能配置或系统服务。聚合源还可能从其他上游重新引入单个来源已删除的误杀域名。
- 采用：只登记 Full 与 Lite 两条规范 Raw URL，均保持 `enabled=false`。优先测试 Lite，且必须置于 `dist/managed-ai.list`、专用直连列表和 `dist/managed-filter.list` 之后；完整版本仅作覆盖优先的高风险备选。
- 未复制 21 万条第三方正文，未修改 `dist/`、保护基线、脚本/节点图标链接，也未加入会员、Cookie/Token 或 MitM 内容。

## 2026-08-28 完整配置复核与策略优化

- 主去广选择：采用 AWAvenue Quantumult X v1.7.6（902 条，2026-08-20）。该版本主动删除误杀的 `log.aliyuncs.com`，更符合低开销、低误杀目标；fmz200、Cats-Team、blackmatrix7 超大型广告分流不再叠加启用。
- 服务分流：Google 从 Loon 路径改为原生 Quantumult X 列表（711 条）；GitHub 从 `host-keyword` 改为 31 条专用列表，避免把名称中偶然含有 `github` 的无关域名一并代理。Apple、WeChat、Telegram、TikTok、Spotify 与媒体规则只在对应策略存在时按需启用。
- 上游异常：`blackmatrix7/ios_rule_script` 的 `rule/QuantumultX/Global/Global.list` 当前 blob 为空，没有作为全球兜底候选；继续登记内容非空的 `ConnersHua/RuleGo` `Proxy.list`。
- 许可边界：检索到 `QuixoticHeart/rule-set`，但其 README 明确限制转载或发布至中国大陆地区。本仓库不复制、不镜像，也不登记其生成文件为候选。
- 策略修复：删除重复的“兜底分流”包装层，`final` 直接交给 `Shawn`；新增 AI 自动组与韩国节点组；把所有大小写标志统一放到正则开头，并将自动测速改为按需触发，减少后台唤醒。
- TLS 与 MitM：完整私有配置将 `skip_validating_cert` 恢复为 `false`，删除 CTYun 通配重写和 MitM，只保留已有精确主机；这些私有证书与订阅变化不进入本公开仓库。
