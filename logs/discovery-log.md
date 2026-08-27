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
