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
