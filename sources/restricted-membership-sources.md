# 会员 / VIP / RevenueCat 来源风险目录

> **不可执行研究索引。** 本页不是 Quantumult X 资源，不提供 Raw、CDN、一键导入或脚本直链；所有来源均未启用、未复制、未合并。

## 研究范围

- 快照日期：2026-08-29。
- 只登记公开 GitHub 仓库主页、维护状态、目录规模、许可证和风险类别。
- 不评价或保证任何解锁效果，不保存响应模板、收据内容、正则、hostname 或脚本正文。
- 仓库更新时间只说明代码发生变化，不代表安全、合法、兼容或仍然有效。

## 机制与边界

- RevenueCat 官方文档说明，客户端通过 `CustomerInfo` 的有效 entitlement 判断访问权限；改写本地响应不会创建真实商店交易或正式服务端权益：[CustomerInfo](https://www.revenuecat.com/docs/customers/customer-info)、[Entitlements](https://www.revenuecat.com/docs/getting-started/entitlements)。
- Apple 的 StoreKit 交易和 App Store Server API 使用可验证的签名交易信息；仅修改客户端显示无法替代正式交易验证：[验证收据](https://developer.apple.com/documentation/storekit/validating-receipts-with-the-app-store)、[App Store Server API](https://developer.apple.com/documentation/appstoreserverapi)。
- Quantumult X 的响应正文脚本属于 HTTPS 重写，通常需要 MitM；范围过宽会把账户、收据和登录响应一起交给第三方脚本处理：[官方示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)。

## 公开来源快照

| 来源主页 | 2026-08-29 状态 | 目录观察 | 许可证 / 使用边界 | 风险与结论 |
| --- | --- | --- | --- | --- |
| [chxm1023/Rewrite](https://github.com/chxm1023/Rewrite) | 未归档；最近推送 2026-08-28 | 341 项，约 322 个 JS；包含 `Reheji.js` 等合集 | GitHub 未识别许可证；脚本头另有限制转载与售卖声明 | RevenueCat 与应用专用脚本混合，分支元数据与历史引用路径不一致；只登记主页，高风险，不采用 |
| [Yu9191/Rewrite](https://github.com/Yu9191/Rewrite) | 未归档；最近推送 2026-08-29 | 559 项，约 300 个 JS、76 个配置；包含 `Revenuecat.js` | GitHub 未识别许可证 | 多客户端脚本与模块合集，功能边界复杂；高风险，不采用 |
| [yqc007/QuantumultX](https://github.com/yqc007/QuantumultX) | 未归档；最近推送 2024-05-08 | 167 项，约 158 个 JS；大量文件名带 `Crack` / `Vip` | GitHub 未识别许可证；README 限制 Fork 与商业用途 | 长期未推送且被大量二次合集引用，兼容性和供应链风险高；不采用 |
| [NobyDa/Script](https://github.com/NobyDa/Script) | 未归档；最近推送 2026-08-12 | 115 项，约 40 个 JS、35 个配置；任务、增强与历史重写混合 | GPL-3.0 | 许可证相对明确，但聚合引用常脱离原上下文；仅作历史来源交叉核验，不采用会员功能 |
| [89996462/Quantumult-X](https://github.com/89996462/Quantumult-X) | 未归档；最近推送 2026-08-25 | 885 项，约 821 个 JS；含 `VIPALL` 等聚合文件 | GitHub 未识别许可证 | 文件量大、命名不透明、功能混杂；难以逐项确认作者与权限，高风险，不采用 |
| [Moli-X/Resources](https://github.com/Moli-X/Resources) | 未归档；最近推送 2026-08-28 | 1175 项，约 144 个 JS、161 个配置；覆盖多个代理客户端 | GitHub 未识别许可证 | 二次聚合与跨格式转换增加来源漂移和镜像风险；只登记主页，不采用 |
| [Yunxingz/Rewrite](https://github.com/Yunxingz/Rewrite) | 未归档；最近推送 2026-06-12 | 507 项，约 439 个 JS、40 个配置；包含 RevenueCat / iTunes 合集 | GitHub 未识别许可证 | 以收据与 entitlement 改写为主，账号和支付风险高；不采用 |
| [Semporia/Quantumult-X](https://github.com/Semporia/Quantumult-X) | 未归档；最近推送 2026-07-10 | 1388 项；图标、分流、重写和脚本混合 | GitHub 未识别许可证；README 含免责声明 | 不是纯会员源，混合目录容易被误当成整包资源；仅作镜像/归属交叉核验，不采用 |

## 后续审计必须补充的字段

1. 仓库是否归档、最后推送日期、默认分支及历史路径是否仍可读取。
2. SPDX 许可证或作者明确授权；没有许可证时默认不得复制、镜像或再发布。
3. 是否只是二次聚合，以及脚本真实作者、上游仓库和内容哈希能否追溯。
4. 是否触碰 `api.revenuecat.com`、App Store 收据、账户、登录、设备标识或持久化存储。
5. MitM hostname 是否精确，是否混入定位伪造、Cookie/Token、广告、成人内容或其他非会员功能。
6. 是否存在真实设备与合法自有测试账号的证据；没有证据时不得进入候选，更不得启用。

## 采用结论

- 新增研究来源：8 个仓库主页。
- 可执行链接：0。
- 复制脚本或规则：0。
- 启用或合并：0。
- 当前去广分流与重写产物保持纯广告/稳定性修正范围。
