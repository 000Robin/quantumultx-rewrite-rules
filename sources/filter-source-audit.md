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
