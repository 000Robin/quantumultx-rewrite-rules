# Surge 独立转换版

此目录是从仓库现有 Quantumult X `dist/` 与 `scripts/` **复制后独立转换**的 Surge 版本。原有 Quantumult X 文件、受保护规则和图标链接不参与转换，也不会被 Surge 文件覆盖。

## 安装

### 1. 基础分流

在 Surge 的模块页面安装：

```text
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/surge/modules/managed-routing.sgmodule
```

该模块包含仓库现有的中国电信登录、12306、农行和抖音商城精确直连，以及腾讯视频、云闪付、中国电信和 QQ 音乐广告主机拒绝。直连规则排在拒绝规则之前。

### 2. 去广重写

在 Surge 的模块页面安装：

```text
https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/surge/modules/managed-rewrite.sgmodule
```

模块使用 Surge 原生 `http-request`、`http-response`、`binary-body-mode` 和 `URL-REGEX` 语法。启用前须在 Surge 中生成并信任本机 CA，再开启 MitM；模块只追加仓库已经审查过的精确 hostname，不包含证书或密码。

### 3. AI 分流

Surge 官方限制模块内新增的 `[Rule]` 只能使用 `DIRECT`、`REJECT` 等内置策略，不能直接使用 `ChatGPT`、`AI服务` 自定义策略。因此 AI 分流保留为两份外部 Rule Set。把下列两行放到主配置 `[Rule]` 的通用 Google、Microsoft、全球代理规则及 `FINAL` 之前：

```ini
RULE-SET,https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/surge/rules/ai-chatgpt.list,ChatGPT,update-interval=86400
RULE-SET,https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/main/surge/rules/ai-services.list,AI服务,update-interval=86400
```

主配置必须已经存在同名策略组。也可以通过 `#!include` 引入 [`ai-routing.dconf`](ai-routing.dconf)，但仍应确保它展开在 `FINAL` 之前。

## 转换边界

- 没有复制机场订阅、MitM 证书、密码、Cookie、Token 或设备标识。
- 没有会员、VIP、RevenueCat、收据或定位伪造功能。
- 二进制脚本已改用 Surge 的 `Uint8Array` 输入/输出；12306 本地响应改用 Surge 的 `response` 对象。
- 不 MitM 腾讯视频播放主机或 `googlevideo.com`；未知响应仍原样放行。
- Surge 与 Quantumult X 两套文件独立维护；以后变更必须同时通过各自校验，不能用简单后缀替换同步。

Surge 语法依据：[模块限制](https://manual.nssurge.com/profile/module.html)、[脚本与二进制正文](https://manual.nssurge.com/scripting/overview.html)、[Rule Set](https://manual.nssurge.com/rules/ruleset.html)、[MitM](https://manual.nssurge.com/http/mitm.html)。

## 本地校验

```bash
python tools/validate_rules.py
python surge/tools/validate_surge.py
node surge/tests/scripts.test.js
```
