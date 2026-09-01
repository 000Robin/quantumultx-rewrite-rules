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

### 中国农业银行安全直连

```ini
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/abc-direct.list, tag=中国农业银行直连, update-interval=259200, opt-parser=false, inserted-resource=true, enabled=true
```

该列表只包含农行官方及农行自有业务域名的 `direct` 规则，应放在大型去广与代理分流之前。为避免证书固定校验或占位 DNS 引发误判，还应把下列项目**合并**到现有配置对应字段，不要新建第二条 `hostname` 或 `dns_exclusion_list`：

```ini
# 追加到 [general] 的 dns_exclusion_list
abchina.com, *.abchina.com, abchina.com.cn, *.abchina.com.cn, 95599.cn, *.95599.cn, openaboc.com, *.openaboc.com

# 追加到 [mitm] 的 hostname
-abchina.com, -*.abchina.com, -abchina.com.cn, -*.abchina.com.cn, -95599.cn, -*.95599.cn, -openaboc.com, -*.openaboc.com
```

这能避免代理出口和 MitM 造成的风控误判，但不能向 App 隐藏 iOS 正在运行的 VPN 隧道；若 App 检测的是系统 VPN 状态，域名直连无法保证阻止退出。

### 抖音商城安全直连

```ini
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/douyin-commerce-direct.list, tag=抖音商城直连修正, update-interval=86400, opt-parser=false, inserted-resource=true, enabled=true
```

该列表必须放在 AWAvenue、其他广告分流和海外 TikTok 规则之前。它只直连抖音商城的 `ecombdapi.com`、`ecombdimg.com`、`ecombdpage.com`，以及实测需要保持国内出口的 `ecomuser.snssdk.com`、`tp-pay.snssdk.com`。不直连整个 `snssdk.com`、`zijieapi.com`、`amemv.com` 或字节图片 CDN，不会把普通广告与日志链路整体放行。

2026-09-01 HAR 显示商城 API 返回 200，但海外 TikTok 上游包含整个 `snssdk.com`，会把国内商城用户链路转到代理；同一 HAR 中支付网关已出现状态 0。该精确列表用于避免商城 API 直连、用户/支付接口代理造成的分裂出口，同时继续保留海外 TikTok 的专用域名策略。

### AI 精确分流

```ini
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/managed-ai.list, tag=Robin AI精确分流, update-interval=86400, opt-parser=false, inserted-resource=true, enabled=true
```

该列表内置 `ChatGPT` 与 `AI服务` 两个策略名：OpenAI 登录、上传、静态资源、功能配置和实时连接统一进入 `ChatGPT`；Claude、Gemini、Copilot、Grok、Perplexity 与 Poe 进入 `AI服务`。它必须放在广告分流、Google/微软通用分流和全球代理规则之前，并且**不要设置 `force-policy`**。

规则按官方产品/API 文档与上游列表逐项收紧，不采用 `HOST-KEYWORD`、IP-CIDR、IP-ASN，也不接管 `stripe.com`、`auth0.com`、`sentry.io`、`segment.io`、`algolia.net`、`featuregates.org`、整个 `statsigapi.net`、整个 `googleapis.com` 或整个 Microsoft/Bing 域名。仅保留 ChatGPT 实际使用的 `api.statsig.com` 与 `events.statsigapi.net` 精确主机。OpenAI 核心域名仍应排除 MitM，避免 TLS 检查破坏上传或 WebSocket。

### 去广重写

```ini
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/managed-rewrite.snippet, tag=Robin个人维护去开屏, update-interval=259200, opt-parser=false, enabled=true
```

两个公开 Raw 文件只包含精确直连修正、已验证的广告拒绝规则和最小 hostname，不包含 MitM 私钥、订阅、Cookie、Token 或会员解锁脚本。腾讯视频应用内弹窗由 `scripts/tencent_video_popup_clean.js` 处理：净化 `i.video.qq.com` 根接口 JSON 中明确标记的广告容器与节点，并识别“广告”角标和“了解更多”按钮同时出现的个人页原生广告卡片；“观看历史”模块受到显式保护，解析失败时原样放行。2026-08-31 暂停广告 HAR 另确认静态创意来自 `wa.gtimg.com/adxcdn/`，管理片段只对该广告交换路径内的常见图片格式返回透明图片，不拦截整个 `gtimg.com`，也不处理 `getvinfo`、`batchvinfo` 或 `playproxy`。

YouTube 由 `scripts/youtube_ad_clean.js` 处理：只解密 `youtubei.googleapis.com` 的内容接口。JSON 响应删除明确命名的广告容器/渲染器；二进制 `player` 响应只移除顶层广告位字段 7 和 68，其余字段逐字节保留。规则不 MitM `*.googlevideo.com`，不修改播放权限、账户、字幕、后台播放、画中画或界面设置。

番茄小说采用安全模式：只拦截穿山甲 `get_ads` 广告清单以及两个明确的广告素材路径，hostname 全部使用精确主机。不会拦截 `fqnovelvod` 听书视频、通用 `snssdk`、`gurd` 动态组件或 `zijieapi.com`；完整第三方分流在 2026 年已有影响听书的公开反馈，因此未直接合并。该规则也会使依赖同一广告接口的“观看广告领奖励”不可用。

12306 采用“合法空响应”而不是连接拒绝：2026-09-01 的启动 HAR 显示，`getAdList` 连续返回 404 后，App 仍会保留约 4 秒的蓝色本地启动容器并显示“跳过”。`scripts/railway_12306_splash_clean.js` 只读取请求中的广告位编号，并立即返回 HTTP 200；启动位 `0007` 使用无网络素材和 `skipTime=0`，其余广告位返回空列表。`ad.12306.cn` 的精确 `direct` 分流必须保留，供 `script-analyze-echo-response` 读取请求并生成响应；不会 MitM 或改写 `mobile.12306.cn`、`kyfw.12306.cn`、登录、购票或支付接口。

### 会员解锁来源研究

会员、VIP、RevenueCat、App Store 收据和订阅解锁来源只收录到 [`sources/restricted-membership-sources.md`](sources/restricted-membership-sources.md) 的不可执行风险目录。目录只保存仓库主页、维护状态、许可证和风险判断，不提供 Raw/CDN、一键导入、脚本正文或可执行规则；这些内容永远不得进入 `dist/`、候选资源或个人去广基线。

对文字不可选、只存在于图片或无法直接复制的公开页面，阅读结果只进入 [`sources/noncopyable-source-notes.md`](sources/noncopyable-source-notes.md)：保存来源、读取限制、不超过 25 个词的短摘录和原创摘要。遇到登录、付费或浏览器安全限制不绕过，也不把二次介绍页当成可执行上游。

## 建议启用结构

1. 先加载 `dist/managed-ai.list`，确保 AI 登录、上传和接口不会被广告或通用服务规则抢先命中。
2. 如需农行保护，再加载 `dist/abc-direct.list`，并合并对应 DNS 与 MitM 排除项。
3. 使用国内抖音商城时加载 `dist/douyin-commerce-direct.list`，必须放在 AWAvenue 和海外 TikTok 列表之前。
4. 加载 `dist/managed-filter.list`，保护中国电信登录、抖音安全验证和 12306 稳定性。
5. 分流修正列表按需选择一个，不要无差别叠加。
6. 主去广分流只选一个：轻量可测试 AWAvenue，中量可用 fmz200，覆盖优先可继续使用 Cats-Team；不建议再叠加 blackmatrix7 超大型列表。
7. 重写层保留 `dist/managed-rewrite.snippet`，再按实际安装的 App 选择专用重写；不要同时启用多个相同大型合集的 Raw/CDN 镜像。

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
- `sources/restricted-membership-sources.md`：会员/VIP/RevenueCat 来源的不可执行风险目录，仅用于审计。
- `sources/noncopyable-source-notes.md`：不可复制或视觉页面的极短摘录、原创摘要与访问限制记录。
- `dist/managed-filter.list`：供 Quantumult X 引用的精简去广分流与修正列表。
- `dist/managed-ai.list`：OpenAI 与常用国际 AI 服务的精确分流；不含宽泛共享域名、IP 或 ASN 规则。
- `dist/abc-direct.list`：中国农业银行官方及农行自有业务域名的独立直连列表。
- `dist/douyin-commerce-direct.list`：抖音国内商城 API、素材、用户和支付接口的精确直连列表，避免与海外 TikTok 的 `snssdk.com` 规则冲突。
- `dist/managed-rewrite.snippet`：供 Quantumult X 引用的公开、脱敏重写片段。
- `scripts/tencent_video_popup_clean.js`：腾讯视频应用内弹窗/广告卡片的保守 JSON 净化脚本，不处理会员或正片播放接口。
- `tests/tencent_video_popup_clean.test.js`：腾讯视频个人页广告移除及观看历史、VIP、账号、播放字段保留测试。
- `scripts/youtube_ad_clean.js`：YouTube JSON/二进制播放响应的纯广告清理脚本，不拦截视频 CDN。
- `tests/youtube_ad_clean.test.js`：YouTube 广告字段移除、正常播放字段保留和异常放行回归测试。
- `scripts/railway_12306_splash_clean.js`：12306 广告清单的本地合成响应，避免 404 触发启动页等待。
- `tests/railway_12306_splash_clean.test.js`：12306 启动位零延迟、其他广告位空列表和异常请求体回归测试。
- `examples/optimized-policy.conf`：脱敏的个人策略组参考，包含 AI/地区自动选择与低频按需测速；不是可直接加载的远程资源。
- `logs/discovery-log.md`：每次研究的来源、判断与变更记录。
- `automation/PROMPT.md`：每三天任务的执行边界。
- `tools/validate_rules.py`：本地与 GitHub Actions 共用的语法、顺序和敏感信息检查。

## 安全边界

仓库永远不得包含 MitM 证书、证书密码、机场订阅、GitHub 令牌、Cookie、登录态或设备标识。带“会员/VIP/RevenueCat/订阅解锁/Cookie 获取”等功能的来源仅保留为原始目录记录，不得自动合并到广告基线。提交前运行 `python tools/validate_rules.py`。

完整权利和第三方归属说明见 `LICENSE` 与 `NOTICE.md`。公开仓库不需要也不得在 Quantumult X URL 中加入 GitHub Token。
