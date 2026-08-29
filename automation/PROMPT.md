# 每三天研究任务

在公开只读、仅所有者可写的仓库 `000Robin/quantumultx-rewrite-rules` 的本地检出目录执行一次增量研究并推送结果。

1. 先拉取 `main` 最新提交并阅读 `SECURITY.md`、两个来源审计文件和全部 `rules/protected-*.conf`。
2. 检查 `sources/all-rewrite-sources.conf` 的 54 条上游及 `sources/filter-candidates.conf` 的分流上游是否更新、失效或迁移；优先使用作者仓库、原始发布页和公开文档。
3. 在公开网络和 GitHub 搜索近期 Quantumult X 去广告分流、去开屏、startup、splash、Advertising 重写规则。只研究公开且与广告净化直接相关的内容。
4. 页面文字不可选、无法复制或只存在于图片时，不得跳过：保存来源 URL，使用页面渲染、截图或 OCR 读取，写不超过 25 个词的短摘录和自己的摘要。遇到登录墙、付费墙或明确禁止访问时不得绕过，只记录受限状态。
5. 去重并检查 Quantumult X 语法、脚本类型、hostname/MitM 范围和潜在误杀。没有实机或 HAR 证据时，不扩大通配 hostname，不拦截核心业务/视频播放接口。
6. 绝不能修改、删除、禁用、重排或替换任何 `rules/protected-*.conf`。对全部保护文件做变更前后比较；有任何差异就停止本次推送。
7. 新发现只追加到对应的 `sources/candidates.conf` 或 `sources/filter-candidates.conf`，必须 `enabled=false`，并在 `logs/discovery-log.md` 记录日期、来源、功能、可达性、冲突和采用理由。主去广分流不得自动启用两个以上。
8. 会员/VIP/RevenueCat/收据/订阅解锁、Cookie/Token 获取、定位伪造等非广告功能只做风险标记，不复制、不启用、不合并。若需登记，只能在 `sources/restricted-membership-sources.md` 写仓库主页、日期、许可证和高层风险；禁止 Raw/CDN、文件直链、一键导入、脚本正文、规则、hostname 或响应模板。
9. 运行 `python tools/validate_rules.py`，再扫描暂存差异，确认不含 p12、passphrase、订阅 token、Cookie、账号或 GitHub 凭据；没有可信增量时只记录“无可采纳更新”，不要制造变化。
10. 有安全且可验证的增量时提交并推送 `main`；完成后在本任务中简要报告新增数、失效数、受限但已摘录数和提交链接。失败时保留本地证据并报告，不强推。
11. 本仓库仅供所有者个人使用，不接受外部贡献；不得移除 `LICENSE`、`NOTICE.md`、`CONTRIBUTING.md` 或 `.github/CODEOWNERS`。
