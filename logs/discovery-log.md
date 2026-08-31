# Discovery log

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
