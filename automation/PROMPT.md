# Quantumult X 三日研究与通用订阅维护

维护仓库 000Robin/quantumultx-rewrite-rules，将现有 Quantumult X 来源研究、分流审计和通用补充更新合并为一次三日任务。工作目录为本仓库的本地检出目录。此仓库当前公开可读；以实际状态及 SECURITY.md 为准，禁止上传完整私人配置。

目标是持续研究可靠去广告/去开屏来源，将经过审查、去重和验证的改进发布到以下两个固定链接，不新增重复订阅：
分流：https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/general-filter.list
重写：https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/general-rewrite.snippet

每次执行：
1. 检查工作区，保留用户未提交内容；只在可安全快进时同步 main。阅读 automation/PROMPT.md、SECURITY.md、sources/general/README.md、sources/general/exclusions.json、最近的来源审计与发现日志。记录全部 rules/protected-*.conf 的哈希，先运行仓库校验。Python 命令无效时使用实际可用的 Python 解释器，不能把无输出当作成功。
2. 检查 sources/all-rewrite-sources.conf、sources/filter-candidates.conf 及 general 的来源清单，按当前实际条目研究，不硬编码数量。优先原作者 GitHub、原始发布页和文档，检查更新、失效、迁移及许可。网络/TLS错误不能判成链接失效；HTTP 200 HTML不能当作规则。页面为图片时可截图/OCR并记录短摘要，禁止绕过登录、付费或访问限制。
3. 每轮优先比较 AWAvenue 分流与 blackmatrix7 重写的上游增量，同时研究其他可靠去广告来源。刷新已启用专用模块的主机排除清单，包含仓库 dist/filter、dist/rewrite、外部专用链接、AI/农行/抖音商城保护和已登记本地主机保护。保持“专用优先、通用补充”；不把专用规则并回通用文件。专用来源读取失败时保留旧排除范围，不能因获取失败删除保护。
4. 用户已授权将安全、可验证的研究成果合并发布到上述两个文件。已采用上游的变更须逐项审核；其他新来源只有在许可允许、语法兼容、明确为广告且有可信依据、无专用重叠及核心业务冲突时，才从停用候选晋升为通用补充。保留来源、许可、采用理由及对应构建输入，必要时同步扩展生成器和回归测试。未通过审核的候选继续 enabled=false，不为追求数量盲目合并整包。
5. 检查相同规则、同主机/路径覆盖、父域覆盖、分流抢先阻断重写、响应类型和 MitM范围。保持固定主机、明确广告路径及最小解密范围；未经实机或HAR证据，不扩大通配主机、不阻断登录、支付、内容或正片播放接口。保护12306合法空响应、百度网盘、番茄听书/既定专用范围、腾讯视频、银行、电信登录和AI服务。
6. 更新必要的上游快照与 sources/general/exclusions.json；SHA-256按UTF-8/LF规范计算，保留许可。只有可信内容变更时更新日期。运行 tools/build_general_rules.py 生成两个固定输出及统计，再运行 --check、tests/test_general_rules.py 和 tools/validate_rules.py。审查增删差异；必要时补充针对本次变化的冲突测试。静态检查不能宣称iPhone实测。
7. 绝不修改、删除、禁用、重排或替换 rules/protected-*.conf；发布前核对全部哈希。原专用模块保持独立，未经对应任务授权不改其行为。会员/VIP/RevenueCat/收据/订阅解锁、Cookie/Token获取及定位伪造不纳入。敏感材料和原始HAR不得提交；非广告风险仅按仓库规范记录高层信息。
8. 仅在验证全部通过、保护哈希不变、暂存差异无凭据且范围明确时，提交并推送 main，不强推。检查两个Raw链接返回实际规则并与本地发布内容一致；有条件时核验对应CI。失败则保留证据并报告具体阻碍，不发布不合格规则。
9. 将采用依据、来源、排除原因、规则数量变化和验证结果记录到仓库现有审计/发现日志，供后续研究复用。无可信更新时保持规则及提交不变，不制造日期或日志空转提交。仅在有实质更新、确认失效、运行失败或需要用户处理时通知；状态无变化且无可操作事项时保持安静。通知简述变化、验证边界和提交链接。
