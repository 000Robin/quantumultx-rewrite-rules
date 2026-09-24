# Discovery log

## 2026-09-15 — 云闪付广告分流修复

- 现象：所有者反馈原有通用广告资源已无法稳定屏蔽云闪付广告；自维护分流此前没有云闪付专属规则。
- 公开交叉验证：[`fmz200/wool_scripts` 云闪付片段](https://github.com/fmz200/wool_scripts/blob/main/QuantumultX/rewrite/split/partY/UnionPayCloudPay.snippet)仍列出 `ads.95516.com`、`tysdk.95516.com` 与 `ads.cup.com.cn`；[`zirawell/R-Store`](https://github.com/zirawell/R-Store/tree/main/Rule/QuanX/Adblock/App/Y/%E4%BA%91%E9%97%AA%E4%BB%98)用于确认其他方案仍需 MitM 钱包主机，因此未在无 HAR 情况下采用。
- 采用：把三个语义明确的广告主机加入 `dist/managed-filter.list`，使用 Quantumult X 原生精确 `host ... reject`，不依赖远程重写解析。
- 排除：不拦截 `wallet.95516.com`、`switch.cup.com.cn`、个推共享域名、登录、支付或整段 `95516.com` / `cup.com.cn`，不新增 MitM hostname。
- 保护：`rules/protected-*.conf`、脚本图标和节点/策略图标链接均未修改。

## 2026-08-19 — 初始化

- 从用户提供配置的 `[rewrite_remote]` 脱敏提取 54 条来源。
- 46 条可直接读取；8 条不可直接读取但均已登记和说明。
- 冻结 7 条远程去开屏基线和 13 条本地/连接层启动广告规则。
- 未复制完整第三方脚本；只保存来源、短摘要、规则统计与兼容性判断。
- 未修改用户原始 Quantumult X 配置。

## 2026-08-19 — 公开发布准备

- 新增仅供个人使用、禁止复制/修改/再分发的保留权利声明，并明确公开 GitHub 无法技术性阻止克隆或 Fork。
- 新增 `dist/managed-rewrite.snippet`，只包含原配置中已验证的去开屏拒绝规则和最小 MitM hostname。
- 不公开完整用户配置、证书、节点订阅、Cookie、Token 或会员解锁代码。

## 2026-08-22 — 三日增量研究

- 上游复核：54 条中 53 条返回 200、1 条返回 403；失效 0、确认迁移 0。
- 已恢复：此前记录的 3 条 403 与 5 条 404 本次全部可直接读取；未改动原目录顺序和启停状态。
- 受限来源：`https://limbopro.com/Adblock4limbo.conf` 返回 403；未绕过限制，保留 URL，未产生新摘录。
- 风险隔离：`chxm1023/Rewrite/main/Reheji.js` 内容指纹变化，但属于 RevenueCat/订阅解锁类别，未复制、未启用、未合并。
- 新增候选 1 条：`https://raw.githubusercontent.com/chxm1023/Advertising/main/AppAd.conf`，功能为 App 广告与开屏净化，公开可达，最近相关提交为 2026-08-13。
- 候选审查：65 条拒绝、17 条响应脚本；依赖脚本未发现凭据或订阅解锁读写。因 hostname 较宽并与现有广告合集重叠，只以 `enabled=false` 收录，等待实机/HAR 验证。

## 2026-08-26 — 去广分流与安全加固

- 对照 Quantumult X 官方示例，补充独立 `filter_remote` 产物；混合 `direct/reject` 文件明确禁止设置 `force-policy`。
- 审计 AWAvenue、fmz200、Cats-Team、blackmatrix7 四类主去广分流及两个 Unbreak 来源；只登记 URL、快照、规模和判断，候选全部停用。
- 新增最小分流基线：4 条精确直连、3 条腾讯视频连接层拒绝；不复制大型第三方列表。

- 中国电信重写正则从任意 `*.189.cn` 收紧为 `wapside.189.cn`，并在 MitM hostname 加入两个登录域名排除项；`*.ctyun.cn` 宽 MitM 从默认管理片段隔离，等待精确 HAR。
- 识别当前配置中 fmz200 分流、fmz200 重写及 blackmatrix7 Advertising 的重复镜像；本次不自动删除受保护历史基线。
- 新增无第三方依赖的规则校验脚本与 GitHub Actions，检查敏感信息、候选启停、分流顺序和电信 MitM 回归。

## 2026-08-27 腾讯视频应用内弹窗增量

- 依据：用户 2026-08-21 HAR 形成的既有约束，以及本次对公开 GitHub 腾讯视频规则的复核。
- 采用：为 `https://i.video.qq.com/` 根接口增加自编响应脚本，只清空明确广告容器、过滤带广告标志或已知 `promotionTest` / `starter` 素材的节点。
- 安全：JSON 解析失败时原样放行；不匹配 `vv6.video.qq.com/getvinfo`、`playproxy.video.qq.com` 或其他播放接口；不修改会员、账户、订阅或权益字段。
- 拒绝复制：公开来源中存在全域拦截、过宽 hostname 及 VIP 修改内容，均未合并。

## 2026-08-28 — YouTube 纯去广告增量

- 官方语法依据：复核 [`crossutility/Quantumult-X/sample.conf`](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)，沿用 `script-response-body` 与精确 `hostname` 写法。
- 近期主实现：[`Maasea/sgmodule/youtube.response.js`](https://github.com/Maasea/sgmodule/blob/master/Script/Youtube/youtube.response.js) 于 2026-07-19 更新，当前使用二进制 protobuf 并在播放器响应中识别 `adPlacements` / `adSlots`；同一增强脚本还会修改后台播放、画中画、字幕和界面，因此只研究其广告字段结构，没有复制或引用该脚本。
- 交叉来源：[`fmz200/wool_scripts` 的 YouTube 片段](https://github.com/fmz200/wool_scripts/blob/main/QuantumultX/rewrite/split/partY/YouTube.snippet)（2025-10-18）同时使用 `youtubei.googleapis.com` 响应脚本和 `rr*.googlevideo.com/initplayback` 拒绝；[`ddgksf2013/Rewrite`](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/YoutubeAds.conf)（2025-04-15）还包含 `*.googlevideo.com` 通配 MitM 与功能增强；[`app2smile/rules`](https://github.com/app2smile/rules/blob/master/module/youtube-qx.conf)（2024-04-28）证明 Quantumult X 需处理 `browse` / `next` 的二进制响应。
- 采用：新增自编 `youtube_ad_clean.js`。JSON 仅删除明确命名的广告容器和渲染器；protobuf 仅在 `/player` 顶层删除长度分隔的字段 7 与 68，其余字段保持原始字节。
- 安全取舍：只加入 `youtubei.googleapis.com`，没有加入 `*.googlevideo.com`、`rr*.googlevideo.com`、`www.youtube.com` 或 `s.youtube.com`；没有合并 Premium、会员、后台播放、画中画、字幕翻译、Cookie/Token 或界面改造。
- 校验：新增正常播放字段保留、广告字段移除、非播放器二进制放行、畸形 JSON/protobuf 放行测试，并接入 `tools/validate_rules.py`。

## 2026-08-28 — 腾讯视频“观看历史”下方原生广告

- 现象：用户截图确认腾讯视频“我的”页在“观看历史”模块下方插入独立原生广告卡片；当前示例同时显示“广告”角标和“了解更多”按钮。
- 公开来源复核：[`fmz200/wool_scripts` 腾讯视频分流](https://github.com/fmz200/wool_scripts/blob/main/Loon/rule/TencentVideo.list)主要依赖整域拒绝 `gdt.qq.com`、`l.qq.com`、`rdelivery.qq.com` 等广告网络；因范围较大且没有该卡片的精确接口证据，本次未合并这些域名。
- 采用：扩展现有 `i.video.qq.com` JSON 清理器，只把“广告”与“了解更多”同时存在的数组卡片识别为原生广告；不写入截图中的具体广告主或文案，避免规则随广告轮换失效。
- 保护：若节点包含“观看历史”则不在该层删除，继续向下清理更小的广告子卡片；新增回归测试确认观看记录、VIP、账号、播放状态和普通内容保持不变，畸形 JSON 原样放行。

## 2026-08-28 — 完整配置去重与服务分流候选

- 脱敏审计完整配置：启用重写从 37 条收敛为 14 条；删除 raw/CDN 镜像、多个大型去开屏合集，以及 VIP、RevenueCat、收据、试用期和 Cookie/Token 类解锁资源。完整配置含订阅和 MitM 私钥，未写入仓库。
- 主去广分流只选择 AWAvenue v1.7.6；新增 Google、GitHub、Apple、WeChat、抖音/TikTok、Telegram、Spotify、流媒体、国内 ASN 与全球兜底候选，全部保持 `enabled=false`。
- 精确性：Google 改用 Quantumult X 原生路径；GitHub 用专用列表替代 `host-keyword`；删除整段抖音直连，保留 `vcs-lf.zijieapi.com` 安全验证直连。
- 未采用：blackmatrix7 `Global.list` 当前为空；QuixoticHeart 规则集存在明确地域再发布限制；二者均未加入运行配置。
- 新增 `examples/optimized-policy.conf`，只保存无凭据的策略组参考，不包含节点、订阅、证书或完整个人配置。

## 2026-08-29 — 中国农业银行安全直连

- 官方核验：中国农业银行安全公告明确列出 `abchina.com`、`95599.cn` 及掌上银行使用的 `abchina.com.cn`；农行深圳分行公开页面确认 `openaboc.com` 为农行自有业务域名。
- 交叉核验：blackmatrix7 的中国直连列表包含 `abchina.com`；公开 Quantumult X 配置也普遍将 `95599.cn` 与 `abchina.com` 设为直连。社区来源只用于交叉验证，实际采用域名均有农行官方页面佐证。
- 采用：新增 `dist/abc-direct.list`，仅含 4 条 `host-suffix ... direct`，不加入动态 IP 段、不拦截接口、不修改账户、交易或设备状态。
- MitM：README 给出主配置合并项，覆盖根域及子域的 DNS 占位排除和负向 hostname；仓库不保存任何 CA、证书密码或完整配置。
- 能力边界：直连与不解密可减少代理出口、占位 DNS 和证书固定校验导致的风控，但无法隐藏 iOS 的 VPN 隧道状态。

## 2026-08-29 — 会员 / VIP / RevenueCat 来源隔离目录

- 全网公开检索并核验 8 个代表性 GitHub 来源：`chxm1023/Rewrite`、`Yu9191/Rewrite`、`yqc007/QuantumultX`、`NobyDa/Script`、`89996462/Quantumult-X`、`Moli-X/Resources`、`Yunxingz/Rewrite`、`Semporia/Quantumult-X`。
- 新增 `sources/restricted-membership-sources.md`：只保存仓库主页、最后推送日期、目录规模、许可证和风险，不保存任何可执行文件链接。
- 官方机制复核：RevenueCat entitlement 与 Apple 签名交易属于真实权益依据；Quantumult X 客户端响应改写不能替代正式交易，并会扩大账户、收据与 MitM 风险。
- 本轮可执行链接 0、复制脚本 0、启用 0、合并 0；`dist/` 和全部保护基线未改变。
- 强化 `SECURITY.md`、自动审计提示和校验脚本，防止后续把 Raw/CDN、一键导入或会员解锁规则误提交到仓库。

## 2026-08-29 — 不可复制 / 视觉来源原创阅读记录

- 研究对象：第三方 Moli X 介绍页及其指向的公开 GitHub 项目主页。
- 读取结果：公开搜索索引可读取主要文字；直接视觉渲染被当前云浏览器安全策略拒绝，未绕过、未截图、未 OCR 受限内容。
- 采用：新增 `sources/noncopyable-source-notes.md`，只保存来源、14 字短摘录和原创风险分析。
- 结论：页面混合会员、广告、增强和多客户端资源，只作发现线索；新增可执行候选 0、复制脚本 0、复制规则 0、启用 0、合并 0。
- 保护：`dist/`、`sources/candidates.conf`、`sources/filter-candidates.conf` 和全部 `rules/protected-*.conf` 未修改。

## 2026-08-30 — 三日来源与安全复核

- 可达性：54 条重写上游和 19 条分流候选均返回 HTTP 200；但 5 条 `ddgksf2013.top` 旧地址的正文已统一变为 HTML 资源首页，属于“HTTP 成功、内容失效”。
- 处置：停用其中 4 条此前仍启用的旧地址；`zhihu.ads.js` 原本已停用。未找到作者确认的规范迁移路径，因此不使用已删除 Gist 或第三方转存。
- 隔离：正文复核确认 7 条启用来源包含 VIP、RevenueCat、收据或付费内容解锁，全部改为 `enabled=false`；可执行内容未复制、未合并到 `dist/`。
- 去重：确认 blackmatrix7 Advertising、ddgksf2013 Applet、fmz200 rewrite 的镜像重复仍存在于历史总目录；受保护基线不变，本轮不重排历史条目。
- 新增候选 0、确认迁移 0、HTTP 状态失效 0、内容失效 5、风险隔离 7；校验器新增对应的停用回归检查。

## 2026-08-31 — 番茄小说安全去广

- 公开来源：复核 [`zqzess/rule_for_quantumultX`](https://github.com/zqzess/rule_for_quantumultX/blob/master/QuantumultX/rewrite/FanQieNovel.qxrewrite) 的番茄小说规则；确认穿山甲 `get_ads` 和明确广告素材路径仍在当前版本中。
- 误杀证据：该仓库 [Issue #66](https://github.com/zqzess/rule_for_quantumultX/issues/66) 于 2026-02-08 报告完整分流会使番茄 7.0.7 听书一直转圈。
- 采用：自行整理 3 条精确重写，只拦广告清单、广告渲染素材和广告安装包；使用 9 个精确 hostname，不采用通配 MitM。
- 保护：不拦 `fqnovelvod`、通用 `snssdk`、`gurd` 或 `zijieapi.com`，继续避免抖音安全验证和番茄听书误伤；不包含 Cookie、Token、会员或付费解锁。
- 校验：为应命中和必须放行的 URL 增加静态回归检查；全部 `rules/protected-*.conf` 未修改。

## 2026-08-31 — 腾讯视频暂停广告 HAR 增量

- 证据：用户提供约 68 秒、952 条记录的 Quantumult X HAR；原始 HAR 仅在本地分析，未加入仓库，也未复制请求头、Cookie、Token、设备标识或完整查询参数。
- 定位：按暂停后唯一新加载的广告创意为 `wa.gtimg.com/adxcdn/...jpg`，解码内容为静态商品广告；随后出现第三方曝光上报。已有广告清单请求被拒绝，但该素材仍返回 HTTP 200，因此缓存广告仍可显示。
- 采用：新增一条精确 `wa.gtimg.com/adxcdn/` 图片拒绝规则和一个精确 MitM hostname；只覆盖 `jpg/jpeg/png/gif/webp`，不拦整个 `wa.gtimg.com` 或 `*.gtimg.com`。
- 保护：未采用旧版 `vv.video.qq.com/getvmind` 整接口拒绝；继续禁止拦截 `vv.video.qq.com`、`vv6.video.qq.com`、`playproxy.video.qq.com`，保护 `getvinfo`、`batchvinfo`、正片、进度和投屏链路。
- 未采用：曝光上报域名不影响画面呈现，本次不扩大到 `pmpmonitor.365dmp.com`、`mm.365dmp.com` 或整个广点通域名。

## 2026-08-31 — AI 分流重构

- 问题：原 `ChatGPT` 组仍暴露“自动选择”和 `proxy`，可能绕回香港等不支持地区；综合 AI 上游又位于广告规则之后，非 OpenAI 服务可能被抢先误判。
- 官方复核：OpenAI 网络建议明确列出 `chatgpt.com`、`openai.com`、`oaistatic.com`、`oaiusercontent.com`、`oaistatsig.com`、`openaimerge.com` 与 WorkOS 等依赖，并建议关闭这些域名的 TLS 检查；Google 官方 Gemini API 使用 `generativelanguage.googleapis.com`；Anthropic 官方 API 使用 `api.anthropic.com`。
- 采用：新增 `dist/managed-ai.list`，OpenAI 进入 `ChatGPT`，Claude、Gemini、Copilot、Grok、Perplexity 与 Poe 进入 `AI服务`；列表应放在广告、Google/微软通用规则和全球兜底之前。
- 收紧：不复制上游的 `HOST-KEYWORD`、IP-CIDR、IP-ASN，也不接管共享的 `stripe.com`、`auth0.com`、`sentry.io`、`segment.io`、`algolia.net`、`featuregates.org`、整个 `statsigapi.net`、整个 `googleapis.com` 或整个 Bing/Microsoft 365；Statsig 只保留两个实际主机。
- 策略：`AI服务` 默认使用仅含美国、日本、新加坡、台湾、韩国的 `AI自动`；`ChatGPT` 默认跟随 `AI服务`，两组均删除普通“自动选择”和 `proxy`，继续排除香港、澳门和俄罗斯。
- 保护：全部 `rules/protected-*.conf` 未修改；新增规则不含 MitM、凭据、会员或响应改写。

## 2026-09-01 — 12306 启动容器 / “跳过”按钮修复

- 证据：用户提供约 12 秒、61 条记录的 Quantumult X HAR，覆盖两次冷启动；原始 HAR 只在本地分析，未加入仓库，也未复制请求头、Cookie、Token、设备标识或完整查询参数。
- 定位：`ad.12306.cn/ad/ser/getAdList` 在每次启动连续返回空的 HTTP 404，约 4 秒后才出现广告监测请求；期间没有下载广告图片。说明素材已被阻断，但错误响应触发了 App 的本地超时容器，因此蓝色页面和“跳过”按钮仍存在。
- 广告位：只记录请求体中的非敏感广告位编号 `0007`、`0075`、`G0054`，未保存请求体原文。
- 采用：新增自编 `railway_12306_splash_clean.js` 与精确 `script-analyze-echo-response` 规则。启动位立即返回无网络素材、`skipTime=0` 的 HTTP 200 JSON；其余广告位返回空列表，避免 404 等待。
- 保护：只 MitM `ad.12306.cn` 的 `getAdList`；保留现有精确 `direct` 分流，不触碰 `mobile.12306.cn`、`kyfw.12306.cn`、登录、购票、支付或监测接口。全部 `rules/protected-*.conf` 未修改。
- 交叉验证：公开实现普遍使用同一精确广告接口与 `script-analyze-echo-response`；另有公开响应净化实现将启动位 `skipTime` 设为 0。本仓库未复制第三方脚本，采用独立实现并新增回归测试。

## 2026-09-01 — 抖音商城“网络异常”分流修复

- 证据：用户提供约 20.9 MB、125 条记录的 Quantumult X HAR；原始 HAR 仅在本地分析，未加入仓库，也未复制 Cookie、Token、签名、设备标识、商品信息或完整参数。
- 定位：商城 `ecombdapi.com` 接口返回 HTTP 200；同一页面还解析 `ecomuser.snssdk.com`，另一次商城支付请求 `tp-pay.snssdk.com/gateway-u` 返回状态 0。配置同时启用国内抖音与海外 TikTok，而上游 TikTok 列表包含整个 `snssdk.com`，导致商城 API 直连、用户/支付接口代理的分裂出口。
- 采用：新增 `dist/douyin-commerce-direct.list`，只包含 `ecombdapi.com`、`ecombdimg.com`、`ecombdpage.com` 三个商城专用后缀和两个实测 `snssdk.com` 精确主机；该列表应位于广告分流与海外 TikTok 列表之前。
- 未采用：不直连整个 `snssdk.com`、`zijieapi.com`、`amemv.com`、`byteimg.com` 或 `douyinpic.com`，避免绕开现有广告净化；未修改任何响应、账户、订单或支付数据。
- 保护：全部 `rules/protected-*.conf` 未修改；新增文件只含 `direct` 分流，不含 MitM、脚本、Cookie、Token、会员或付费解锁。

## 2026-09-02 — 蒙电 e 家开屏广告 HAR 增量

- 证据：用户提供约 13 秒、49 条记录的 Quantumult X HAR，包含两次冷启动；原始 HAR 仅在本地分析，未加入仓库，也未复制请求头、Cookie、Token、用户、户号、设备标识或完整参数。
- 定位：`mdej.impc.com.cn/hlwyy/business-mdej/sycd/queryResourcesList` 在冷启动约 0.6 秒时返回资源清单；同一 `data` 数组包含应用更新 APK 与 JPG 开屏素材，不能拒绝整个接口。
- 采用：新增自编 `mengdian_splash_clean.js` 与精确响应重写。只有 `wjlx` 和 `fileFullPath` 扩展名同时确认为 JPG/JPEG/PNG/GIF/WebP 时才移除记录；APK、顶层状态和未知字段保持不变。
- 保护：Quantumult X 会按主机解密 `mdej.impc.com.cn`，但重写规则只匹配资源清单的精确路径，不改写登录、用户、缴费、账单、户号、消息或公告接口；异常 JSON 原样放行。HAR 第二轮的多接口 502 未被当作广告请求，也未扩大拦截范围。
- 未采用：不拒绝整个 `mdej.impc.com.cn`，不拦截 DCloud 启动统计域名，不保存或改写账户数据。全部 `rules/protected-*.conf` 未修改。

## 2026-09-08 — 三日来源与安全复核

- 全量复核 54 条重写来源、19 条分流候选和 1 条停用重写候选；没有确认 404、迁移或可安全新增的候选。
- AWAvenue 仍为 v1.7.6（902 行）；Cats-Team `qx.conf` 更新为 7,804,760 B；blackmatrix7 Advertising 更新为 283,593 条。后两者继续因体积、重叠和误杀风险保持停用。
- 5 条已停用的 `ddgksf2013.top` 旧地址仍返回 HTML 资源页；Limbopro 官方入口在当前环境返回 403，但作者仓库仍活跃且继续推荐原地址，暂记访问受限，不采用镜像。
- 未修改 `dist/`、脚本/节点图标链接或 `rules/protected-*.conf`；未吸收会员/VIP、RevenueCat、Cookie/Token、定位伪造内容。

## 2026-09-09 — 番茄小说激进视频去广

- 用户确认不需要番茄短剧，并要求将激进视频拦截加入个人 GitHub；因此在既有穿山甲清单/素材规则之外增加两个视频规则。
- 章内视频规则只匹配公开规则中实际出现的 `v3/v5/v6/v9-novelapp.fqnovelvod.com`，且路径必须包含 `/video/`；短剧规则只覆盖 `v3/v5/v9-reading-video.fqnovelvod.com`。
- 未采用 `*.fqnovelvod.com` 通配 MitM，也未接管 `fq-tts`、通用 `snssdk`、`gurd`、`zijieapi.com` 或书籍接口；听书音频和抖音商城分流保持原状。
- 预期代价：章内视频、短剧和观看广告领奖励不可用。未修改 `rules/protected-*.conf`、脚本/节点图标链接或其他应用规则。

## 2026-09-10 — 兴业生活开屏广告 HAR 增量

- 证据：用户提供约 8 秒的 Quantumult X HAR，覆盖两次冷启动；原始 HAR 只在本地分析，未加入仓库，也未复制请求头、请求体、Cookie、Token、设备标识或账户信息。
- 定位：两次启动均请求 `gap.cibfintech.com/entry/queryLaunchAdListV2`；接口名称和时序明确指向开屏广告清单。HAR 只记录请求而没有有效响应体，因此没有臆造服务端 JSON 结构。
- 采用：新增一条精确 `queryLaunchAdListV2` 请求拒绝和一个精确 MitM hostname；不拒绝整个 `gap.cibfintech.com`。
- 保护：新增回归检查，确保规则不匹配导航、应用更新、iOS 跳转、通知或相似路径；未修改登录、支付、账户、会员、Cookie/Token、`rules/protected-*.conf`、脚本图标或节点图标链接。
- 风险：该主机还承载兴业生活核心接口。若证书固定校验导致 TLS 或页面异常，应停用此重写并以新的可读取响应 HAR 设计保守响应净化。

## 2026-09-10 — 217heidai 去广分流审计

- 来源：审计 `217heidai/adblockfilters` 的 Quantumult X Full 与 Lite 官方 Raw；仓库为 GPL-3.0，并声明每 8 小时合并、去重和剔除无法解析域名。
- 快照：提交 `7405f810`，版本 `20260910204948`。Full 为 214,643 条/8,522,393 B，Lite 为 5,323 条/205,590 B；全部活动行均为三字段 `host-suffix` 拒绝规则，未发现重复活动行。
- 重叠：Lite 与 AWAvenue 当前 949 个字面模式重合 501 个，不能作为第二个主列表叠加。Full/Lite 均拒绝 `ad.12306.cn`，Full 另涉及 AI 与 Apple 共享服务，存在明确顺序冲突和误杀风险。
- 采用：新增两条停用候选，推荐仅在 AWAvenue 覆盖不足时单独测试 Lite；`managed-ai`、专用直连列表与 `managed-filter` 必须位于其前。Full 只作高风险备选。
- 保护：未复制第三方规则正文，未修改 `dist/`、`rules/protected-*.conf`、脚本图标或节点图标链接，未吸收会员、Cookie/Token、定位或 MitM 内容。

## 2026-09-11 — 三日来源与安全复核

- 全量检查 54 条重写来源、1 条停用重写候选和 21 条分流候选；新增确认失效 1 条、迁移 0、新增候选 0。
- `Yu9191/wloc/main/modules/wloc.conf` 的 Raw 与 GitHub Contents API 均返回 404，原作者仓库已不可检索。该来源属于定位修改且早已停用；仅标注失效，不采用第三方镜像。
- Cats-Team、blackmatrix7 与 217heidai Full/Lite 均有生成内容变化，但超大型列表的误杀结论及 `enabled=false` 状态不变；217heidai 对 12306、AI 和 Apple 共享服务的已知冲突仍存在。
- 公开检索未发现安全、可信且有实机/HAR证据的新广告候选；混合会员/增强内容、宽泛 MitM 和无许可证来源均未吸收。
- 未修改 `dist/`、`rules/protected-*.conf`、脚本/节点图标链接；未复制会员/VIP、RevenueCat、Cookie/Token 或定位伪造内容。

## 2026-09-15 — iScreen 开屏广告 HAR 增量

- 证据：用户提供约 3.6 MB、226 条记录的 Quantumult X HAR，包含两次 iScreen 启动；原始 HAR 仅在本地分析，未加入仓库，也未复制请求头、请求体、Cookie、Token、设备标识或完整查询参数。
- 定位：两次启动均先请求 `cs.kuso.xyz/configs` 与 `cs.kuso.xyz/configs2/default`；响应明确包含 `launchAd`、`SplashTimeout`、`oLaunch`（开屏广告）、`oCommon`（开屏全局控制）、`sOverseaLaunch`（热启动）和 `sLaunch`（开屏完成后插屏）控制。
- 采用：新增自编 `iscreen_splash_clean.js` 与一条精确响应重写。旧配置只把 `launchAd`、`SplashTimeout` 设为 0；分组配置只把上述四个启动组的 `rate` 设为 0，并在已有时把启动组的 `maxDisplayCount` 设为 0。
- 保护：不拦截 `hzm.kuso.xyz` 的首页/用户接口或 `cdnq.kuso.xyz` 的壁纸/组件素材；不拒绝整个广告 SDK 主机，不改 Banner、信息流、账号、付费或内容字段，未知响应原样放行。
- 隔离：历史目录中的 `89996462/Quantumult-X` 两条 iScreen 脚本属于收据/订阅改写，不是开屏去广，继续保持 `enabled=false`，未复制其脚本或 hostname。
- 未修改 `rules/protected-*.conf`、脚本图标、节点/策略图标链接或其他应用规则；未保存或改写会员、收据、Cookie、Token 与设备信息。

## 2026-09-17 — 三日来源与安全复核

- 检查 54 条重写来源、1 条停用重写候选和 21 条分流候选；新增候选 0、确认失效 0、迁移 0。既有 1 条 404、5 条 HTML 伪响应与 1 条访问受限来源状态不变。
- AWAvenue 与 fmz200 轻量/中量来源没有迁移；Cats-Team、blackmatrix7、217heidai Full/Lite 的生成内容发生变化，但其超大体积、重叠和误杀结论不变，全部继续保持 `enabled=false`。
- 217heidai 当前 Full/Lite 仍拒绝 `ad.12306.cn` 和 `log.cmbchina.com`，Full 仍拒绝 `api.statsig.com`；不适合作为无条件替换或与其他主列表叠加。
- 公开检索只发现现有上游、旧镜像、个人整包和混合会员/增强内容；没有安全、可信且有实机/HAR 证据的新候选。
- 未修改 `dist/`、`rules/protected-*.conf`、脚本/节点图标链接；未复制会员/VIP、RevenueCat、Cookie/Token、定位伪造内容。

## 2026-09-17 — 中国电信与 QQ 音乐广告域名精确拦截

- 用户确认仅使用中国电信移动网络，并要求直接拦截 QQ 音乐中出现的电信广告；采用公开规则交叉确认的广告专用主机，不拒绝运营商或 QQ 音乐整域。
- 新增 4 个中国电信广告主机：`ad.21cn.com`、`ad.k.21cn.com`、`admarket.21cn.com`、`adshows.21cn.com`。
- 新增 8 个 QQ 音乐广告投放主机，覆盖 `tencentmusic.com` 广告分发和 `y.qq.com` 的 TME 广告主机；不拦截签到使用的 `u6.y.qq.com`、播放接口或共享 CDN。
- 保留 `appgologin*.189.cn` 登录、`wapside.189.cn` 话费 Cookie、`e.dlife.cn` 登录态及 `open.e.189.cn` 认证；未增加 MitM，不修改脚本/节点图标或受保护规则。

## 2026-09-20 — 三日来源与安全复核

- 全量复核 54 条重写来源、1 条停用重写候选和 21 条分流候选；新增候选 0、确认失效 0、迁移 0。既有 1 条 404、5 条 HTML 伪响应和 Limbopro 访问受限状态不变；当前环境无法直接读取的自定义域名未被误判为失效。
- AWAvenue 仍为 v1.7.6-release（33,511 B、952 条活动规则），但复核正文确认其包含 `ad.12306.cn,reject` 与 `api.statsig.com,reject`。前者会绕过本仓库的 12306 精确空响应处理，后者可能影响 AI 共享服务；该候选继续保持 `enabled=false`，手动测试时必须置于相应直连/AI 修正规则之后。
- Cats-Team 更新至 7,962,559 B/199,908 条，blackmatrix7 更新至 12,176,344 B/284,202 条；217heidai 更新至版本 `20260920023137`，Full 为 8,558,507 B/215,535 条，Lite 为 203,773 B/5,278 条。四份活动规则语法有效且未发现重复活动行，但超大体积、重叠和共享服务误杀风险未消失，全部继续停用。
- 公开检索复核了 2026-09-04 新建的 `hwind2021/QuantumultX-AdBlock-CN`。该仓库虽有 MIT 许可证，但为零采用量的自动聚合源，包含宽泛 `HOST-KEYWORD`、通用广告 SDK 范围，并缺少实机/HAR 验证；与现有候选高度重叠，本轮不登记。
- 未修改运行规则、`dist/`、`rules/protected-*.conf`、脚本/节点图标链接；未复制或合并会员/VIP、RevenueCat、Cookie/Token、定位伪造内容。

## 2026-09-23 — 三日来源与安全复核

- 全量复核 54 条重写来源、1 条停用重写候选和 21 条分流候选；新增候选 0、确认失效 0、迁移 0。GitHub 文本资源仍只有既知的 `Yu9191/wloc` 返回 404；5 条 HTML 伪响应、自定义域名访问限制和 Limbopro 内容类型限制不作新的失效判断。
- AWAvenue 已从 v1.7.6-release 更新至 v1.7.8-release（33,946 B、965 条活动规则）。与旧快照逐行比较新增 13 条、删除 0 条；其中 2 条为上游变更日志确认的哔咔漫画广告接口/展示域名，其余来自 suffix/keyword 输出修复。语法有效且无重复活动行。
- AWAvenue 仍拒绝 `ad.12306.cn` 和 `api.statsig.com`，因此继续保持 `enabled=false`，不得绕过 12306 精确处理与 AI 修正规则直接启用。
- Cats-Team、blackmatrix7 和 217heidai 的生成列表发生常规刷新，语法与重复检查通过；已知共享服务冲突未消失，全部继续停用。近期公开检索只返回现有上游、镜像或此前已拒绝的自动聚合源，没有新增可采纳候选。
- 未修改运行规则、`dist/`、`rules/protected-*.conf`、脚本/节点图标链接；未复制或合并会员/VIP、RevenueCat、Cookie/Token、定位伪造内容。

## 2026-09-23 — 懂车帝开屏广告 PCAP 复核

- 证据：用户提供约 30.3 秒、101 个数据包的短时 PCAP；原始抓包仅在本地解析，未加入仓库，也未记录 Cookie、Token、设备标识、完整查询参数或其他敏感字段。
- 抓包边界：应用启动末段只出现 `dig.bdurl.net`、`www.bytedance.com`、`vod-license-m.volccdn.com` 与 `vod-settings.volcvod.com` 的 DNS 查询和建连，没有捕获可解析的广告 HTTPS 请求或响应体，不能仅凭 DNS 把这些域名判定为开屏广告。
- 公开交叉验证：`fmz200/wool_scripts` 的懂车帝专用 Quantumult X 规则持续使用 `p3-pack.byteimg.com` 与 `p6-pack.byteimg.com`；其他公开列表对 `dig.bdurl.net` 的分类存在直连、广告与白名单冲突，因此不采用该域名。
- 采用：在 `dist/managed-filter.list` 新增两个精确 `host` 拒绝；相较上游 `host-keyword` 进一步收紧匹配范围，不增加 MitM，也不拦截整个 `byteimg.com`、`bytedance.com`、`volccdn.com` 或 `volcvod.com`。
- 保护：新增校验锁定这两条精确规则，并禁止把本次抓包中的共享/核心服务或整个字节图片、视频域加入管理分流。

## 2026-09-24 — 百度网盘开屏广告 HAR 复核

- 证据：用户提供约 29 秒、394 条记录的 Quantumult X HAR；原始 HAR 仅在本地分析，未加入仓库，也未保存请求头、Cookie、Token、设备标识、账号、完整查询参数或其他敏感字段。
- 定位：两次冷启动均请求同一张 1000×1000 JPEG 广告素材，路径为 `fancydsp.oss-cn-beijing.aliyuncs.com/upload/ftx/advertiser/…jpg`；图片内容经本地解码确认是广告创意。同期 `api-v3.mentamob.com/api/v2/config` 返回包含 `MentaVL37SplashAdapter` 的广告 SDK 配置，`api-nxs-v4.mentamob.com/api/v1/nx_campaign` 返回投放活动，`ad-api.adn-plus.com.cn/mb/sdk1/json` 返回广告响应。
- 采用：在 `dist/managed-filter.list` 新增上述四个精确广告主机的连接层拒绝，无需 MitM；素材 URL 中的具体文件名不入库。
- 未采用：旧公开规则中的 `pan.baidu.com/rest/2.0/pcs/adx`、`act/api/activityentry` 和 `issuecdn.baidupcs.com/…/guanggao` 未在本次成功广告链路中出现；当前 HAR 中相关旧接口为空或返回 404，因此不添加无效重写。
- 保护：保持 `pan.baidu.com`、`diskapi.baidu.com`、`panpic.baidu.com`、整个 `aliyuncs.com` 及百度账号、文件、缩略图、会员接口可达；新增校验禁止扩大到这些核心或共享域名。
