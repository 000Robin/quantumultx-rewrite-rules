# 来源审计（2026-08-19）

## 结果

- 总数：54。
- 可直接解析：46。
- 不可直接解析：8；全部保留，未静默跳过。
- 明确重复：blackmatrix7 Advertising 的 jsDelivr/raw 两条、ddgksf2013 Applet 的两种 raw 写法、fmz200 rewrite 的两种 GitHub raw 写法。
- 大型集合：blackmatrix7 Advertising 约 768 行/751 条拒绝；fmz200 rewrite 约 4001 行/1365 条拒绝/228 条脚本；ddgksf2013 StartUpAds 约 1069 行/461 条拒绝/31 条脚本；Adblock4limbo 约 215 行/44 条拒绝/72 条脚本。

## 不可复制或不可达来源

### 403，但不跳过

以下三个来源返回 403：

- `https://yfamilys.com/rewrite/adultraplus.conf`
- `https://yfamilys.com/rewrite/adultra.conf`
- `https://yfamilys.com/rewrite/startingad.conf`

公开说明页的短摘录为：“`[rewrite_remote] 重写；示例为 adultraplus.conf，AntiAD-Rewrite。`”据此将三条归类为 Quantumult X 去开屏/广告重写资源；原始链接、顺序和启用状态完整保留，并列入保护基线。后续任务应重试正文读取；若页面只以图片或不可选文本呈现，必须截图/OCR 后写短摘要和来源，不能跳过。

### 404，但不删除

- `WeiGiegie/666/main/wangyiyun.js`
- `WeiGiegie/666/main/bdyy.js`
- `cat-kun/QuantumultX-block-ad/master/haoxing.conf`
- `ddgksf2013/Rewrite/.../YoutubeAds.conf`
- `ddgksf2013/Rewrite/.../Html/General.conf`

这些条目仍保留在总目录与原启停状态中。后续任务应查找同作者的规范新路径或可信替代，但不得用未经核验的镜像覆盖保护基线。

## 内容分类与隔离

已读内容包含广告/开屏屏蔽、页面净化、功能增强、位置修改、Cookie/Token 获取和付费功能解锁。自动任务只允许吸收广告拒绝和页面净化类候选；会员/VIP/RevenueCat/收据/订阅解锁以及 Cookie/Token 获取类必须隔离，只记录来源，不复制、不启用、不合并。

## 兼容性原则

1. 保留 `rules/protected-splash-baseline.conf` 和 `rules/protected-local-splash.conf` 的字节级内容。
2. 候选条目默认 `enabled=false`。
3. 对重复 URL、镜像 URL、同一规则集的不同分发域名做规范化，但不删除原目录记录。
4. 未经实机/HAR 证据，不扩大 MitM hostname，不使用 `hostname=*`，不拦截视频播放或核心业务接口。
