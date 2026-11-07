# 通用补充：排除专用模块

适配 2026-09-30 的 v8.21 按 App 模块化配置。不修改现有专用模块或冻结开屏基线。

## 订阅

```ini
[filter_remote]
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/general-filter.list, tag=Robin｜通用去广分流（排除专用）, update-interval=86400, opt-parser=false, inserted-resource=true, enabled=true

[rewrite_remote]
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/dist/general-rewrite.snippet, tag=Robin｜通用去广重写（排除专用）, update-interval=86400, opt-parser=false, inserted-resource=true, enabled=true
```

把两行分别追加到现有同名区段，放在专用模块后；不要再启用完整 AWAvenue、217heidai、blackmatrix7 或墨鱼通用合集。保留专用模块、本地规则和现有负向 MitM 排除。hostname 随保留规则重新生成，无通配解密主机。

## 范围与取舍

- 分流采用 AWAvenue v1.7.8-release 的 976 条输入。转换为 Quantumult X 原生 host/host-suffix；删除专用范围、保护域名、通用重写所需主机、关键词等非精确规则，以及被父域规则覆盖的重复项。
- 重写采用 blackmatrix7 Advertising 的 751 条输入（上游标注 2025-08-26）。只保留明确广告路径、固定主机、可解析的 reject 类动作，保留原响应类型。排除通配/IP 主机、无主机锚点、混合路径分支和专用范围。主机点号显式转义。
- 覆盖 8 个 Robin 分流、14 个 Robin 重写模块，以及中国移动、微信小程序、黑料净化、拼多多、Pixiv、微博专用主机。专用主机整体让给专用规则，并保守排除关联服务域名；并非只删完全相同的正则。
- 同时排除本地规则/MitM/DNS 保护范围、AI 服务、农行和抖音商城。静态列表不能证明所有 App、共享广告 SDK 或未来域名绝对无冲突。
- 交叉检查 217heidai 的公开白名单与问题记录，排除 7 个有业务误杀证据的主机范围；保留成对的独立广告主机作为合成命中对照。刷新专用主机后当前生成 751 条通用分流。
- 217heidai 的 214903 条大合集未并入，避免扩大未验证范围。墨鱼旧 StartUpAds.conf 实测 HTTP 200 但正文为 HTML，未用作规则来源。
- 通用覆盖范围刻意收紧；专用去广仍由原模块提供。静态校验不是 iPhone 实机验证，更新后需重新连接并冷启动常用 App 检查广告、登录、支付和播放。

## 可重复更新

已纳入现有“三日研究与通用去广更新”定时任务（每三天 09:30，Asia/Shanghai）。任务按 `automation/PROMPT.md` 研究来源、更新专用排除、审查并验证增量后，推送到这两个固定订阅地址；未通过审查的候选不启用。无实质变化时不产生空转提交或通知。

`exclusions.json` 只保存公开服务域名和来源摘要，不含配置全文。六个外部专用源检查的是 2026-09-30 正文中的 hostname/分流主机，不复制脚本。外部源更新后须重新核对排除项；现有仓库 App 模块和三个保护分流每次构建都会重新读取。

保存上游纯文本快照并更新其 SHA-256 后运行：

```sh
python tools/build_general_rules.py
python tools/build_general_rules.py --check
python -m unittest discover -s tests -p test_general_rules.py
python tools/validate_rules.py
```

审查差异后发布；不会将上游新规则未经筛选直接启用。`report.json` 记录删除原因和最终数量。订阅更新周期仅刷新本仓库已审查的版本，不代表自动抓取上游。

## 来源与许可例外

- `awa.list`、`../../dist/general-filter.list`：源于 [AWAvenue-Ads-Rule](https://github.com/TG-Twilight/AWAvenue-Ads-Rule)，保留 GPL-3.0，许可全文见 `LICENSE-AWA-GPL-3.0.txt`。
- `blackmatrix.conf`、`../../dist/general-rewrite.snippet`：源于 [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)，保留 GPL-2.0，许可全文见 `LICENSE-BM-GPL-2.0.txt`。
- `exclusions.json` 中的误杀排除证据来自 [217heidai/adblockfilters](https://github.com/217heidai/adblockfilters) 的公开问题与白名单（GPL-3.0）；只引用链接和自写摘要，不复制其规则集。
- 本目录其他文件、`../../tools/build_general_rules.py`、`../../tests/test_general_rules.py`：Copyright (c) 2026 000Robin，GPL-3.0；许可全文同上。
- 以上文件不适用根目录的个人专用、禁止修改与再分发限制。两份规则是不同上游的独立衍生文件；其他既有文件的许可不变。上游快照、生成器和排除清单公开保留，便于重建。

## 2026-10-02 毒奶规则增量审查

审查作者仓库 `limbopro/Adblock4limbo` 的 `Adblock4limbo.list` 与 `Adblock4limbo.conf`。
仅选择 3 个广告投放主机，原后缀规则收紧为精确主机；以及小说网页、网页素材的 2 条固定主机广告路径拒绝规则。
审查摘录保存在 `limbopro-filter.list`、`limbopro-rewrite.conf`，保留作者 MIT 许可；生成时继续执行专用主机排除、重写主机保护和去重。
没有引入无主机锚点的 `ad.*` 匹配、整个 CloudFront 解密、OpenAI/Google 等受保护主机解密，也没有引入页面导航、远程脚本注入或非广告功能。
这次增量针对网页广告，不声称修复懂车帝开屏。仅静态审查，手机效果待验证。

## 2026-11-07 业务误杀修复

将 AWAvenue 输入与 217heidai 当前白名单逐项交叉比较，发现通用输出仍拒绝 7 个已有公开业务故障证据的主机范围。生成器现以证据化排除项移除它们；`shouji.sogou.com` 的边界保护同时覆盖其子域 `ws-keyboard.shouji.sogou.com`，因此输出实际减少 8 行。

| 不应命中的业务主机 | 公开证据 | 应继续命中的广告主机（合成对照） |
|---|---|---|
| `a.market.xiaomi.com` | [小米主题预览素材](https://github.com/217heidai/adblockfilters/issues/169) | `api.ad.xiaomi.com` |
| `a0.app.xiaomi.com` | [小米云备份](https://github.com/217heidai/adblockfilters/issues/92) | `diagnosis.ad.xiaomi.com` |
| `tracker.ai.xiaomi.com` | [小爱音箱请求](https://github.com/217heidai/adblockfilters/issues/66) | `globalapi.ad.xiaomi.com` |
| `ccc-x.jd.com` | [京东金融商品链接](https://github.com/217heidai/adblockfilters/issues/162) | `addata.jd.com` |
| `knicks.jd.com` | [京东商品信息](https://github.com/217heidai/adblockfilters/issues/25) | `skdisplay.jd.com` |
| `pkoplink.com` | [网心云节点上报](https://github.com/217heidai/adblockfilters/issues/152) | `ad-cmp.hismarttv.com` |
| `shouji.sogou.com` | [搜狗输入法皮肤](https://github.com/217heidai/adblockfilters/issues/26) | `v2.reachmax.cn` |

上述“应命中”仅为静态匹配回归样例；公开问题中的业务恢复属于上游用户报告，不等于本仓库已在 iPhone 实机复测。
