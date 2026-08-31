#!/usr/bin/env python3
"""Validate the public Quantumult X artifacts without third-party packages."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def active_lines(relative: str) -> list[str]:
    path = ROOT / relative
    if not path.is_file():
        fail(f"missing required file: {relative}")
        return []
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith(("#", ";"))
    ]


def check_sensitive_data() -> None:
    patterns = {
        "MitM private material": re.compile(r"(?im)^\s*(?:p12|passphrase)\s*=\s*\S+"),
        "private key": re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
        "credential assignment": re.compile(
            r"(?i)(?:authorization|cookie|access[_-]?token|subscribe\?token)\s*[:=]\s*[^\s#]{8,}"
        ),
        "credential in URL": re.compile(r"(?i)[?&](?:token|key|auth|owo)=[A-Za-z0-9._~-]{12,}"),
    }
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts or path.suffix in {".png", ".jpg", ".gif"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for label, pattern in patterns.items():
            if pattern.search(text):
                fail(f"{path.relative_to(ROOT)} contains possible {label}")


def check_rewrite() -> None:
    relative = "dist/managed-rewrite.snippet"
    lines = active_lines(relative)
    host_lines = [line for line in lines if line.lower().startswith("hostname")]
    if len(host_lines) != 1:
        fail(f"{relative} must contain exactly one hostname line")

    allowed = re.compile(
        r"\surl\s(?:reject(?:-200|-img|-dict|-array)?|script-(?:request|response)-(?:header|body))(?:\s|$)"
    )
    for line in lines:
        if line.lower().startswith("hostname"):
            continue
        if not line.startswith("^") or not allowed.search(line):
            fail(f"invalid rewrite line: {line}")

    text = (ROOT / relative).read_text(encoding="utf-8")
    hostname_tokens: set[str] = set()
    if host_lines and "=" in host_lines[0]:
        hostname_tokens = {item.strip() for item in host_lines[0].split("=", 1)[1].split(",")}
    for forbidden in ("*.189.cn", "*.ctyun.cn"):
        if forbidden in hostname_tokens:
            fail(f"broad {forbidden} MitM is forbidden")
    if r"[^\/]*\.189\.cn" in text:
        fail("broad China Telecom rewrite regex is forbidden")
    for protected in ("-appgologinhd.189.cn", "-appgologin.189.cn", "wapside.189.cn"):
        if not host_lines or protected not in host_lines[0]:
            fail(f"missing China Telecom MitM protection: {protected}")

    popup_rule = (
        r"^https:\/\/i\.video\.qq\.com\/(?:\?.*)?$ url script-response-body "
        "https://raw.githubusercontent.com/000Robin/quantumultx-rewrite-rules/"
        "main/scripts/tencent_video_popup_clean.js"
    )
    if popup_rule not in lines:
        fail("missing exact Tencent Video in-app popup cleaner rule")
    if not host_lines or "i.video.qq.com" not in hostname_tokens:
        fail("missing Tencent Video popup MitM hostname")
    pause_ad_rule = (
        r"^https:\/\/wa\.gtimg\.com\/adxcdn\/.*\."
        r"(?:jpe?g|png|gif|webp)(?:\?.*)?$ url reject-img"
    )
    if pause_ad_rule not in lines:
        fail("missing exact Tencent Video pause-ad image rule")
    else:
        try:
            pause_ad_pattern = re.compile(pause_ad_rule.split(" url ", 1)[0])
        except re.error as exc:
            fail(f"invalid Tencent Video pause-ad regex: {exc}")
        else:
            should_match = (
                "https://wa.gtimg.com/adxcdn/202606/26/fixture.jpg?md5=fixture",
                "https://wa.gtimg.com/adxcdn/creative/fixture.webp",
            )
            should_not_match = (
                "https://wa.gtimg.com/news/fixture.jpg",
                "https://vfiles.gtimg.cn/wupload/xy/starter/fixture.png",
                "https://vv.video.qq.com/getvinfo",
            )
            for url in should_match:
                if not pause_ad_pattern.search(url):
                    fail(f"Tencent Video pause-ad rewrite unexpectedly misses: {url}")
            for url in should_not_match:
                if pause_ad_pattern.search(url):
                    fail(f"Tencent Video pause-ad rewrite unexpectedly matches protected scope: {url}")
    if "wa.gtimg.com" not in hostname_tokens:
        fail("missing exact Tencent Video pause-ad MitM hostname")
    for playback_host in ("vv.video.qq.com", "vv6.video.qq.com", "playproxy.video.qq.com"):
        if any(playback_host in line for line in lines):
            fail(f"Tencent Video playback host must not be intercepted: {playback_host}")

    youtube_rule = (
        r"^https:\/\/youtubei\.googleapis\.com\/youtubei\/v1\/"
        r"(?:browse|next|player|search|reel\/reel_watch_sequence)(?:\?.*)?$ "
        "url script-response-body https://raw.githubusercontent.com/000Robin/"
        "quantumultx-rewrite-rules/main/scripts/youtube_ad_clean.js"
    )
    youtube_rules = [line for line in lines if r"youtubei\.googleapis\.com" in line]
    if youtube_rules != [youtube_rule]:
        fail("managed rewrite must contain only the exact YouTube ad cleaner rule")
    else:
        try:
            youtube_pattern = re.compile(youtube_rule.split(" url ", 1)[0])
        except re.error as exc:
            fail(f"invalid YouTube rewrite regex: {exc}")
        else:
            should_match = (
                "https://youtubei.googleapis.com/youtubei/v1/player",
                "https://youtubei.googleapis.com/youtubei/v1/browse?key=fixture",
                "https://youtubei.googleapis.com/youtubei/v1/reel/reel_watch_sequence",
            )
            should_not_match = (
                "https://youtubei.googleapis.com/youtubei/v1/guide",
                "https://youtubei.googleapis.com/youtubei/v1/get_setting",
                "https://youtubei.googleapis.com/youtubei/v1/player/extra",
                "https://rr1---sn.example.googlevideo.com/initplayback",
            )
            for url in should_match:
                if not youtube_pattern.search(url):
                    fail(f"YouTube rewrite unexpectedly misses: {url}")
            for url in should_not_match:
                if youtube_pattern.search(url):
                    fail(f"YouTube rewrite unexpectedly matches non-ad scope: {url}")
    if "youtubei.googleapis.com" not in hostname_tokens:
        fail("missing exact YouTube API MitM hostname")
    for hostname in hostname_tokens:
        if "googlevideo.com" in hostname.lower():
            fail(f"YouTube playback CDN must not be intercepted: {hostname}")
    for forbidden_endpoint in ("guide", "get_setting", "get_watch", "log_event", "config"):
        if any(forbidden_endpoint in line for line in youtube_rules):
            fail(f"non-ad YouTube endpoint must not be intercepted: {forbidden_endpoint}")

    fanqie_rules = [
        line
        for line in lines
        if not line.lower().startswith("hostname")
        and ("pangolin-sdk-toutiao" in line or "pglstatp-toutiao" in line)
    ]
    expected_fanqie_rules = [
        r"^https:\/\/api-access\.pangolin-sdk-toutiao(?:[1-5]|-b)?\.com\/api\/ad\/union\/sdk\/get_ads\/?(?:\?.*)?$ url reject-dict",
        r"^https:\/\/sf3-fe-tos\.pglstatp-toutiao\.com\/obj\/ad-pattern\/.*$ url reject",
        r"^https:\/\/sf3-be-pack\.pglstatp-toutiao\.com\/obj\/ad-app-package\/.*$ url reject",
    ]
    if fanqie_rules != expected_fanqie_rules:
        fail("managed rewrite must contain only the three exact Fanqie ad rules")
    else:
        fanqie_patterns = [re.compile(line.split(" url ", 1)[0]) for line in fanqie_rules]
        should_match = (
            "https://api-access.pangolin-sdk-toutiao.com/api/ad/union/sdk/get_ads/",
            "https://api-access.pangolin-sdk-toutiao1.com/api/ad/union/sdk/get_ads/?id=fixture",
            "https://api-access.pangolin-sdk-toutiao-b.com/api/ad/union/sdk/get_ads/",
            "https://sf3-fe-tos.pglstatp-toutiao.com/obj/ad-pattern/renderer/fixture",
            "https://sf3-be-pack.pglstatp-toutiao.com/obj/ad-app-package/fixture",
        )
        should_not_match = (
            "https://api-access.pangolin-sdk-toutiao.com/api/ad/union/sdk/settings/",
            "https://v6-novelapp.fqnovelvod.com/fixture/video/chapter.mp4",
            "https://gurd.snssdk.com/src/server/v3/package",
            "https://is.snssdk.com/api/ad/fixture",
            "https://vcs-lf.zijieapi.com/fixture",
        )
        for url in should_match:
            if not any(pattern.search(url) for pattern in fanqie_patterns):
                fail(f"Fanqie rewrite unexpectedly misses: {url}")
        for url in should_not_match:
            if any(pattern.search(url) for pattern in fanqie_patterns):
                fail(f"Fanqie rewrite unexpectedly matches protected scope: {url}")

    expected_fanqie_hosts = {
        "api-access.pangolin-sdk-toutiao.com",
        "api-access.pangolin-sdk-toutiao1.com",
        "api-access.pangolin-sdk-toutiao2.com",
        "api-access.pangolin-sdk-toutiao3.com",
        "api-access.pangolin-sdk-toutiao4.com",
        "api-access.pangolin-sdk-toutiao5.com",
        "api-access.pangolin-sdk-toutiao-b.com",
        "sf3-fe-tos.pglstatp-toutiao.com",
        "sf3-be-pack.pglstatp-toutiao.com",
    }
    missing_fanqie_hosts = expected_fanqie_hosts - hostname_tokens
    if missing_fanqie_hosts:
        fail(f"missing exact Fanqie MitM hostname: {sorted(missing_fanqie_hosts)}")
    for hostname in hostname_tokens:
        if "*" in hostname and ("pangolin-sdk-toutiao" in hostname or "pglstatp-toutiao" in hostname):
            fail(f"broad Fanqie/Pangle MitM hostname is forbidden: {hostname}")

    telecom_rules = [line for line in lines if r"wapside\.189\.cn" in line]
    if len(telecom_rules) != 1:
        fail("managed rewrite must contain exactly one China Telecom rule")
    else:
        try:
            telecom_pattern = re.compile(telecom_rules[0].split(" url ", 1)[0])
        except re.error as exc:
            fail(f"invalid China Telecom regex: {exc}")
        else:
            should_match = (
                "https://wapside.189.cn/api/startup",
                "https://wapside.189.cn:9001/api/advertisement/list",
            )
            should_not_match = (
                "https://appgologinhd.189.cn/api/startup",
                "https://appgologin.189.cn/api/advert",
            )
            for url in should_match:
                if not telecom_pattern.search(url):
                    fail(f"China Telecom rewrite unexpectedly misses: {url}")
            for url in should_not_match:
                if telecom_pattern.search(url):
                    fail(f"China Telecom rewrite unexpectedly matches login: {url}")


def check_scripts() -> None:
    node = shutil.which("node")
    scripts = {
        "scripts/tencent_video_popup_clean.js": (
            "annualvip",
            "endtime",
            "svip",
            "entitlement",
            "getvinfo",
        ),
        "scripts/youtube_ad_clean.js": (
            "account",
            "backgroundplayer",
            "captionlang",
            "entitlement",
            "pictureinpicture",
            "premium",
            "receipt",
            "subscription",
            "$persistentstore",
            "$prefs",
        ),
    }

    for relative, forbidden_terms in scripts.items():
        path = ROOT / relative
        if not path.is_file():
            fail(f"missing required file: {relative}")
            continue

        text = path.read_text(encoding="utf-8")
        for term in forbidden_terms:
            if term in text.lower():
                fail(f"{relative} must not modify non-ad field or state: {term}")

        if relative == "scripts/tencent_video_popup_clean.js":
            for marker in ('"广告"', '"了解更多"', '"观看历史"'):
                if marker not in text:
                    fail(f"{relative} missing native profile-card safeguard: {marker}")
            if "1688" in text:
                fail(f"{relative} must not depend on one advertiser's copy")

        if node:
            result = subprocess.run(
                [node, "--check", str(path)],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode:
                fail(f"invalid JavaScript syntax in {relative}: {result.stderr.strip()}")

    tests = (
        "tests/tencent_video_popup_clean.test.js",
        "tests/youtube_ad_clean.test.js",
    )
    for test_relative in tests:
        test_path = ROOT / test_relative
        if not test_path.is_file():
            fail(f"missing required file: {test_relative}")
        elif node:
            result = subprocess.run(
                [node, str(test_path)],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode:
                details = result.stderr.strip() or result.stdout.strip()
                fail(f"script regression test failed for {test_relative}: {details}")


def check_filter() -> None:
    baseline_path = "rules/protected-filter-baseline.conf"
    managed_path = "dist/managed-filter.list"
    baseline = active_lines(baseline_path)
    managed = active_lines(managed_path)
    if baseline != managed:
        fail(f"{managed_path} must preserve {baseline_path} line-for-line")

    seen: set[str] = set()
    first_reject = len(managed)
    for index, line in enumerate(managed):
        normalized = re.sub(r"\s+", "", line.lower())
        if normalized in seen:
            fail(f"duplicate filter line: {line}")
        seen.add(normalized)

        fields = [part.strip() for part in line.split(",")]
        if len(fields) != 3 or fields[0] not in {"host", "host-suffix", "host-keyword", "host-wildcard"}:
            fail(f"invalid managed filter line: {line}")
            continue
        if fields[2] not in {"direct", "reject"}:
            fail(f"unexpected managed filter policy: {line}")
        if fields[2] == "reject" and first_reject == len(managed):
            first_reject = index

    critical_direct = {
        "appgologinhd.189.cn",
        "appgologin.189.cn",
        "vcs-lf.zijieapi.com",
        "ad.12306.cn",
    }
    for index, line in enumerate(managed):
        fields = [part.strip() for part in line.split(",")]
        if len(fields) == 3 and fields[1] in critical_direct:
            if fields[2] != "direct" or index >= first_reject:
                fail(f"critical unbreak rule must precede rejects: {line}")
            critical_direct.remove(fields[1])
    for host in sorted(critical_direct):
        fail(f"missing critical unbreak host: {host}")


def check_abc_direct() -> None:
    relative = "dist/abc-direct.list"
    lines = active_lines(relative)
    expected = [
        "host-suffix, abchina.com, direct",
        "host-suffix, abchina.com.cn, direct",
        "host-suffix, 95599.cn, direct",
        "host-suffix, openaboc.com, direct",
    ]
    if lines != expected:
        fail(f"{relative} must contain only the reviewed ABC direct domains in stable order")


def check_ai_filter() -> None:
    relative = "dist/managed-ai.list"
    lines = active_lines(relative)
    if not lines:
        return

    seen: set[str] = set()
    forbidden_domains = {
        "algolia.net",
        "auth0.com",
        "browser-intake-datadoghq.com",
        "segment.io",
        "sentry.io",
        "static.cloudflareinsights.com",
        "stripe.com",
    }
    required = {
        ("host-suffix", "chatgpt.com", "ChatGPT"),
        ("host-suffix", "openai.com", "ChatGPT"),
        ("host-suffix", "oaistatic.com", "ChatGPT"),
        ("host-suffix", "oaiusercontent.com", "ChatGPT"),
        ("host-suffix", "anthropic.com", "AI服务"),
        ("host-suffix", "claude.ai", "AI服务"),
        ("host", "gemini.google.com", "AI服务"),
        ("host", "generativelanguage.googleapis.com", "AI服务"),
        ("host", "copilot.microsoft.com", "AI服务"),
        ("host-suffix", "x.ai", "AI服务"),
        ("host-suffix", "perplexity.ai", "AI服务"),
    }
    parsed: set[tuple[str, str, str]] = set()
    for line in lines:
        normalized = re.sub(r"\s+", "", line.lower())
        if normalized in seen:
            fail(f"duplicate AI filter line: {line}")
        seen.add(normalized)

        fields = tuple(part.strip() for part in line.split(","))
        if len(fields) != 3:
            fail(f"invalid AI filter line: {line}")
            continue
        rule_type, domain, policy = fields
        if rule_type not in {"host", "host-suffix"}:
            fail(f"broad AI rule type is forbidden: {line}")
        if policy not in {"ChatGPT", "AI服务"}:
            fail(f"unexpected AI policy: {line}")
        if domain.lower() in forbidden_domains:
            fail(f"shared non-AI domain must not be captured: {line}")
        if domain.startswith("*.") or "*" in domain:
            fail(f"wildcard AI domain is forbidden: {line}")
        parsed.add((rule_type, domain, policy))

    for item in sorted(required - parsed):
        fail(f"missing required exact AI route: {item}")


def check_candidates() -> None:
    for relative in ("sources/candidates.conf", "sources/filter-candidates.conf"):
        for line in active_lines(relative):
            if line.startswith("http") and "enabled=false" not in line.replace(" ", "").lower():
                fail(f"candidate must remain disabled in {relative}: {line}")


def check_source_catalog_safety() -> None:
    relative = "sources/all-rewrite-sources.conf"
    lines = active_lines(relative)
    restricted_sources = (
        "dandanvip.conf",
        "/nnjk.js",
        "/QQYD.js",
        "/bdyy.js",
        "/BPZJ.js",
        "/xt.js",
        "/Reheji.js",
        "/wloc.conf",
        "/QQMusic.js",
        "/ForOwnUse.conf",
        "/cookies.snippet",
    )
    landing_page_sources = (
        "/rewrite/ZhiLianZhaoPinAds.conf",
        "/scripts/javdbapp.ads.js",
        "/rewrite/StartUpAds.conf",
        "/scripts/zhihu.ads.js",
        "/scripts/bdpan.ads.js",
    )
    for line in lines:
        compact = line.replace(" ", "").lower()
        if any(marker.lower() in line.lower() for marker in restricted_sources):
            if "enabled=false" not in compact:
                fail(f"restricted non-ad source must remain disabled in {relative}: {line}")
        if any(marker.lower() in line.lower() for marker in landing_page_sources):
            if "enabled=false" not in compact:
                fail(f"non-rule landing-page source must remain disabled in {relative}: {line}")


def check_restricted_membership_catalog() -> None:
    relative = "sources/restricted-membership-sources.md"
    path = ROOT / relative
    if not path.is_file():
        fail(f"missing required file: {relative}")
        return

    text = path.read_text(encoding="utf-8")
    lowered = text.lower()
    if "不可执行研究索引" not in text:
        fail(f"{relative} must prominently state that it is non-executable")

    forbidden_markers = (
        "raw.githubusercontent.com",
        "cdn.jsdelivr.net",
        "quantumult-x:///",
        "script-response-body",
        "script-request-body",
        "rewrite_remote",
        "enabled=true",
        "hostname =",
    )
    for marker in forbidden_markers:
        if marker in lowered:
            fail(f"{relative} contains executable membership material: {marker}")

    executable_link = re.compile(
        r"https?://[^\s)>]+\.(?:js|conf|snippet|sgmodule|plugin)(?:[?#][^\s)>]*)?",
        re.IGNORECASE,
    )
    allowed_document_prefixes = (
        "https://github.com/crossutility/Quantumult-X/blob/",
    )
    for match in executable_link.finditer(text):
        if not match.group(0).startswith(allowed_document_prefixes):
            fail(f"{relative} must link only to repository or official documentation pages")

    required_repositories = {
        "https://github.com/chxm1023/Rewrite",
        "https://github.com/Yu9191/Rewrite",
        "https://github.com/yqc007/QuantumultX",
        "https://github.com/NobyDa/Script",
        "https://github.com/89996462/Quantumult-X",
        "https://github.com/Moli-X/Resources",
        "https://github.com/Yunxingz/Rewrite",
        "https://github.com/Semporia/Quantumult-X",
    }
    for repository in sorted(required_repositories):
        if repository not in text:
            fail(f"missing reviewed membership source in {relative}: {repository}")


def check_noncopyable_source_notes() -> None:
    relative = "sources/noncopyable-source-notes.md"
    path = ROOT / relative
    if not path.is_file():
        fail(f"missing required file: {relative}")
        return

    text = path.read_text(encoding="utf-8")
    lowered = text.lower()
    if "不可执行的原创阅读笔记" not in text:
        fail(f"{relative} must prominently state that it is non-executable and original")

    forbidden_markers = (
        "raw.githubusercontent.com",
        "cdn.jsdelivr.net",
        "quantumult-x:///",
        "script-response-body",
        "script-request-body",
        "rewrite_remote",
        "enabled=true",
        "hostname =",
    )
    for marker in forbidden_markers:
        if marker in lowered:
            fail(f"{relative} contains executable material: {marker}")

    executable_link = re.compile(
        r"https?://[^\s)>]+\.(?:js|conf|snippet|sgmodule|plugin)(?:[?#][^\s)>]*)?",
        re.IGNORECASE,
    )
    if executable_link.search(text):
        fail(f"{relative} must not contain executable file links")

    excerpts = re.findall(r"^> 短摘录（(\d+) 字）：“([^”]+)”$", text, re.MULTILINE)
    if not excerpts:
        fail(f"{relative} must contain at least one labeled short excerpt")
    for declared_length, excerpt in excerpts:
        actual_length = len(re.sub(r"\s+", "", excerpt))
        if actual_length != int(declared_length):
            fail(
                f"{relative} excerpt length mismatch: declared {declared_length}, "
                f"actual {actual_length}"
            )
        if actual_length > 25:
            fail(f"{relative} excerpt exceeds the 25-character limit")

    required_links = (
        "https://www.ahhhhfs.com/43894/",
        "https://github.com/Moli-X/Resources",
    )
    for link in required_links:
        if link not in text:
            fail(f"missing reviewed visual source in {relative}: {link}")

    for required_boundary in ("未绕过限制", "可执行链接、复制脚本、复制规则、启用或合并：0"):
        if required_boundary not in text:
            fail(f"{relative} must record the access and execution boundary: {required_boundary}")


def check_policy_example() -> None:
    relative = "examples/optimized-policy.conf"
    lines = active_lines(relative)
    if not lines or lines[0] != "[policy]":
        fail(f"{relative} must contain one [policy] section")
        return

    names: set[str] = set()
    for line in lines[1:]:
        match = re.match(
            r"(?:static|available|round-robin|dest-hash|url-latency-benchmark)=([^,]+),",
            line,
        )
        if not match:
            fail(f"invalid policy example line: {line}")
            continue
        names.add(match.group(1).strip())

        regex_match = re.search(r"server-tag-regex=(.*?),\s*check-interval=", line)
        if regex_match:
            pattern = regex_match.group(1)
            if "(?i)" in pattern and not pattern.startswith("(?i)"):
                fail(f"inline case flag must start the policy regex: {line}")
            try:
                re.compile(pattern)
            except re.error as exc:
                fail(f"invalid policy regex in {relative}: {exc}")
            if "alive-checking=false" not in line.replace(" ", ""):
                fail(f"automatic policy must avoid idle polling: {line}")
            interval = re.search(r"check-interval=(\d+)", line)
            if not interval or int(interval.group(1)) < 600:
                fail(f"automatic policy checks too frequently: {line}")

    required = {
        "Shawn",
        "全球加速",
        "AI服务",
        "ChatGPT",
        "自动选择",
        "AI自动",
        "香港节点",
        "台湾节点",
        "日本节点",
        "狮城节点",
        "韩国节点",
        "美国节点",
    }
    for name in sorted(required - names):
        fail(f"missing required policy example: {name}")

    ai_lines = {line.split("=", 1)[1].split(",", 1)[0].strip(): line for line in lines if line.startswith("static=")}
    for name in ("AI服务", "ChatGPT"):
        line = ai_lines.get(name, "")
        if "自动选择" in line or re.search(r",\s*proxy(?:\s*,|$)", line):
            fail(f"{name} must not inherit unrestricted automatic/proxy nodes: {line}")
    if ai_lines.get("AI服务", "").split(",")[1].strip() != "AI自动":
        fail("AI服务 must default to AI自动")
    if ai_lines.get("ChatGPT", "").split(",")[1].strip() != "AI服务":
        fail("ChatGPT must default to AI服务")


def main() -> int:
    check_sensitive_data()
    check_rewrite()
    check_scripts()
    check_filter()
    check_abc_direct()
    check_ai_filter()
    check_candidates()
    check_source_catalog_safety()
    check_restricted_membership_catalog()
    check_noncopyable_source_notes()
    check_policy_example()
    if ERRORS:
        print("Quantumult X validation failed:", file=sys.stderr)
        for error in ERRORS:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Quantumult X validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
