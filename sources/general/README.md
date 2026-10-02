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

- 分流采用 AWAvenue v1.7.8-release 的 965 条输入。转换为 Quantumult X 原生 host/host-suffix；删除专用范围、保护域名、通用重写所需主机、关键词等非精确规则，以及被父域规则覆盖的重复项。
- 重写采用 blackmatrix7 Advertising 的 751 条输入（上游标注 2025-08-26）。只保留明确广告路径、固定主机、可解析的 reject 类动作，保留原响应类型。排除通配/IP 主机、无主机锚点、混合路径分支和专用范围。主机点号显式转义。
- 覆盖 8 个 Robin 分流、14 个 Robin 重写模块，以及中国移动、微信小程序、黑料净化、拼多多、Pixiv、微博专用主机。专用主机整体让给专用规则，并保守排除关联服务域名；并非只删完全相同的正则。
- 同时排除本地规则/MitM/DNS 保护范围、AI 服务、农行和抖音商城。静态列表不能证明所有 App、共享广告 SDK 或未来域名绝对无冲突。
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
- 本目录其他文件、`../../tools/build_general_rules.py`、`../../tests/test_general_rules.py`：Copyright (c) 2026 000Robin，GPL-3.0；许可全文同上。
- 以上文件不适用根目录的个人专用、禁止修改与再分发限制。两份规则是不同上游的独立衍生文件；其他既有文件的许可不变。上游快照、生成器和排除清单公开保留，便于重建。

## 2026-10-02 毒奶规则增量审查

审查作者仓库 `limbopro/Adblock4limbo` 的 `Adblock4limbo.list` 与 `Adblock4limbo.conf`。
仅选择 3 个广告投放主机，原后缀规则收紧为精确主机；以及小说网页、网页素材的 2 条固定主机广告路径拒绝规则。
审查摘录保存在 `limbopro-filter.list`、`limbopro-rewrite.conf`，保留作者 MIT 许可；生成时继续执行专用主机排除、重写主机保护和去重。
没有引入无主机锚点的 `ad.*` 匹配、整个 CloudFront 解密、OpenAI/Google 等受保护主机解密，也没有引入页面导航、远程脚本注入或非广告功能。
这次增量针对网页广告，不声称修复懂车帝开屏。仅静态审查，手机效果待验证。
