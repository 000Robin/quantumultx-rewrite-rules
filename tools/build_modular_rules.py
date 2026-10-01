#!/usr/bin/env python3
"""Build per-app Quantumult X resources from the stable aggregate artifacts."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FILTER_SOURCE = ROOT / "dist/managed-filter.list"
REWRITE_SOURCE = ROOT / "dist/managed-rewrite.snippet"
FILTER_DIR = ROOT / "dist/filter"
REWRITE_DIR = ROOT / "dist/rewrite"


APP_META = {
    "china-telecom": ("中国电信", "登录直连与广告主机精确拦截"),
    "douyin-security": ("抖音安全验证", "安全验证接口直连修正"),
    "railway-12306": ("铁路 12306", "开屏接口直连与合法空响应"),
    "tencent-video": ("腾讯视频", "开屏、互动广告、弹窗与暂停广告净化"),
    "dongchedi": ("懂车帝", "开屏广告包与曝光监测精确拦截"),
    "jd": ("京东", "开屏广告交易主机与配置接口精确拦截"),
    "baidupan": ("百度网盘", "开屏 SDK、素材与竞价响应净化"),
    "unionpay": ("云闪付", "广告主机精确拦截"),
    "qqmusic": ("QQ 音乐", "广告投放主机精确拦截"),
    "youtube": ("YouTube", "内容接口广告字段净化"),
    "fanqie-novel": ("番茄小说", "广告清单、素材与视频广告拦截"),
    "cmb-life": ("掌上生活", "开屏广告预缓存拦截"),
    "cib-life": ("兴业生活", "开屏广告清单拦截"),
    "zhaopin": ("智联招聘", "商业化接口与开屏素材净化"),
    "hunliji": ("婚礼纪", "启动广告接口拦截"),
    "citic": ("中信银行", "已知尺寸开屏素材拦截"),
    "mengdian": ("蒙电 e 家", "启动资源清单图片净化"),
    "iscreen": ("iScreen", "冷、热启动广告开关净化"),
    "ctrip": ("携程", "行程广告接口拦截"),
}


FILTER_MARKERS = [
    ("# China Telecom login: never intercept or reject certificate-pinned authentication.", "china-telecom"),
    ("# Douyin security verification: exact exception only; do not bypass whole domains.", "douyin-security"),
    ("# Railway app stability: keep the known service endpoint reachable.", "railway-12306"),
    ("# Tencent Video startup/interactive ad connection-layer fallback.", "tencent-video"),
    ("# Dongchedi splash-ad package hosts and HAR-confirmed impression endpoint;", "dongchedi"),
    ("# JD splash advertising exchange hosts only.", "jd"),
    ("# Baidu Netdisk splash-ad SDK and creative delivery hosts.", "baidupan"),
    ("# UnionPay Cloud QuickPass: exact advertising hosts only.", "unionpay"),
    ("# China Telecom advertising hosts only.", "china-telecom"),
    ("# QQ Music advertising delivery hosts.", "qqmusic"),
]


REWRITE_MARKERS = [
    ("# Tencent Video startup/interactive ad transport and media", "tencent-video"),
    ("# Baidu Netdisk splash query/update. Immediately return the service's own valid empty-ad", "baidupan"),
    ("# YouTube ads: exact API host and content endpoints; no googlevideo playback MitM.", "youtube"),
    ("# Fanqie Novel: Pangle ad manifest/assets plus the user-selected aggressive video mode.", "fanqie-novel"),
    ("# JD splash configuration only. The HAR-confirmed normal functionId=startup", "jd"),
    ("# China Merchants Bank splash pre-cache", "cmb-life"),
    ("# CIB Life launch-ad list; exact endpoint only because this host also serves core app functions.", "cib-life"),
    ("# Zhaopin commercial/startup responses observed in the 2026-08-21 HAR. Return valid empty", "zhaopin"),
    ("# Hunliji startup ad", "hunliji"),
    ("# CITIC splash creative by known dimensions", "citic"),
    ("# China Telecom startup endpoint", "china-telecom"),
    ("# China Railway 12306 splash. A rejected/404 response leaves the native timeout screen active;", "railway-12306"),
    ("# Mengdian e Home splash resource list. Preserve application update packages and remove only image entries.", "mengdian"),
    ("# iScreen launch-ad controls confirmed by 2026-09-15 HAR; keep all content and non-launch ad settings intact.", "iscreen"),
    ("# Ctrip trip ad endpoint", "ctrip"),
]


REWRITE_HOSTS = {
    "tencent-video": [
        "i.video.qq.com", "iacc.qq.com", "iacc.rec.qq.com", "vfiles.gtimg.cn",
        "vip.image.video.qpic.cn", "wa.gtimg.com",
    ],
    "baidupan": ["afd.baidu.com"],
    "youtube": ["youtubei.googleapis.com"],
    "fanqie-novel": [
        "api-access.pangolin-sdk-toutiao.com",
        "api-access.pangolin-sdk-toutiao1.com",
        "api-access.pangolin-sdk-toutiao2.com",
        "api-access.pangolin-sdk-toutiao3.com",
        "api-access.pangolin-sdk-toutiao4.com",
        "api-access.pangolin-sdk-toutiao5.com",
        "api-access.pangolin-sdk-toutiao-b.com",
        "sf3-fe-tos.pglstatp-toutiao.com",
        "sf3-be-pack.pglstatp-toutiao.com",
        "v3-novelapp.fqnovelvod.com",
        "v5-novelapp.fqnovelvod.com",
        "v6-novelapp.fqnovelvod.com",
        "v9-novelapp.fqnovelvod.com",
        "v3-reading-video.fqnovelvod.com",
        "v5-reading-video.fqnovelvod.com",
        "v9-reading-video.fqnovelvod.com",
    ],
    "jd": ["api.m.jd.com"],
    "cmb-life": ["mbasecc.bcs.cmbchina.com"],
    "cib-life": ["gap.cibfintech.com"],
    "zhaopin": [
        "storage-public.zhaopin.cn", "capi.zhaopin.com", "fe-api.zhaopin.com",
        "cgate.zhaopin.com",
    ],
    "hunliji": ["api.hunliji.com"],
    "citic": ["autoload.bank.ecitic.com"],
    "china-telecom": ["-appgologinhd.189.cn", "-appgologin.189.cn", "wapside.189.cn"],
    "railway-12306": ["ad.12306.cn"],
    "mengdian": ["mdej.impc.com.cn"],
    "iscreen": ["cs.kuso.xyz"],
    "ctrip": ["m.ctrip.com"],
}


def source_date(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("#!date="):
            return line.split("=", 1)[1].strip()
    raise ValueError(f"missing date metadata: {path.relative_to(ROOT)}")


def extract_blocks(path: Path, markers: list[tuple[str, str]], stop_prefix: str | None = None) -> dict[str, list[str]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    positions: list[tuple[int, str, str]] = []
    for marker, key in markers:
        try:
            index = lines.index(marker)
        except ValueError as exc:
            raise ValueError(f"missing block marker in {path.relative_to(ROOT)}: {marker}") from exc
        positions.append((index, marker, key))
    positions.sort()

    output: dict[str, list[str]] = {}
    for item_index, (start, _marker, key) in enumerate(positions):
        end = positions[item_index + 1][0] if item_index + 1 < len(positions) else len(lines)
        if stop_prefix:
            for line_index in range(start, end):
                if lines[line_index].startswith(stop_prefix):
                    end = line_index
                    break
        block = "\n".join(lines[start:end]).strip()
        output.setdefault(key, []).append(block)
    return output


def header(kind: str, key: str, date: str) -> str:
    name, description = APP_META[key]
    resource = "分流" if kind == "filter" else "重写"
    return "\n".join(
        [
            f"#!name=Robin | {name}{resource}",
            f"#!desc={description}；从聚合版精确拆分，勿与聚合版重复启用。",
            "#!author=000Robin",
            "#!homepage=https://github.com/000Robin/quantumultx-rewrite-rules",
            f"#!date={date}",
        ]
    )


def expected_outputs() -> dict[Path, str]:
    filter_blocks = extract_blocks(FILTER_SOURCE, FILTER_MARKERS)
    rewrite_blocks = extract_blocks(REWRITE_SOURCE, REWRITE_MARKERS, stop_prefix="hostname =")
    outputs: dict[Path, str] = {}

    filter_date = source_date(FILTER_SOURCE)
    for key, blocks in filter_blocks.items():
        outputs[FILTER_DIR / f"{key}.list"] = (
            header("filter", key, filter_date) + "\n\n" + "\n\n".join(blocks) + "\n"
        )

    rewrite_date = source_date(REWRITE_SOURCE)
    for key, blocks in rewrite_blocks.items():
        hosts = REWRITE_HOSTS[key]
        outputs[REWRITE_DIR / f"{key}.snippet"] = (
            header("rewrite", key, rewrite_date)
            + "\n\n"
            + "\n\n".join(blocks)
            + "\n\n"
            + "hostname = "
            + ", ".join(hosts)
            + "\n"
        )
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verify generated files without writing")
    args = parser.parse_args()

    try:
        outputs = expected_outputs()
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 1

    expected_paths = set(outputs)
    existing_paths = set(FILTER_DIR.glob("*.list")) | set(REWRITE_DIR.glob("*.snippet"))
    errors: list[str] = []
    if args.check:
        for path, expected in outputs.items():
            if not path.is_file():
                errors.append(f"missing modular resource: {path.relative_to(ROOT)}")
            elif path.read_text(encoding="utf-8") != expected:
                errors.append(f"stale modular resource: {path.relative_to(ROOT)}")
        for path in sorted(existing_paths - expected_paths):
            errors.append(f"unexpected modular resource: {path.relative_to(ROOT)}")
        if errors:
            for error in errors:
                print(error, file=sys.stderr)
            return 1
        print(f"Modular resources are current: {len(outputs)} files.")
        return 0

    FILTER_DIR.mkdir(parents=True, exist_ok=True)
    REWRITE_DIR.mkdir(parents=True, exist_ok=True)
    for path, content in outputs.items():
        path.write_text(content, encoding="utf-8")
    print(f"Generated {len(outputs)} modular resources.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
