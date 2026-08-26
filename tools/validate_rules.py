#!/usr/bin/env python3
"""Validate the public Quantumult X artifacts without third-party packages."""

from __future__ import annotations

import re
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


def check_candidates() -> None:
    for relative in ("sources/candidates.conf", "sources/filter-candidates.conf"):
        for line in active_lines(relative):
            if line.startswith("http") and "enabled=false" not in line.replace(" ", "").lower():
                fail(f"candidate must remain disabled in {relative}: {line}")


def main() -> int:
    check_sensitive_data()
    check_rewrite()
    check_filter()
    check_candidates()
    if ERRORS:
        print("Quantumult X validation failed:", file=sys.stderr)
        for error in ERRORS:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Quantumult X validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
