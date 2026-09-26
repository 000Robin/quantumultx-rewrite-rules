#!/usr/bin/env python3
"""Validate the independently converted Surge artifacts."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SURGE = ROOT / "surge"
ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def lines(path: Path) -> list[str]:
    if not path.is_file():
        fail(f"missing required file: {path.relative_to(ROOT)}")
        return []
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith(("#", ";", "//"))
    ]


def qx_rules(path: Path) -> list[tuple[str, str, str]]:
    output: list[tuple[str, str, str]] = []
    for line in lines(path):
        parts = [part.strip() for part in line.split(",")]
        if len(parts) != 3 or parts[0].lower() not in {"host", "host-suffix"}:
            fail(f"unexpected Quantumult X rule in {path.relative_to(ROOT)}: {line}")
            continue
        kind = "DOMAIN" if parts[0].lower() == "host" else "DOMAIN-SUFFIX"
        output.append((kind, parts[1], parts[2].upper()))
    return output


def section(path: Path, name: str) -> list[str]:
    active = False
    output: list[str] = []
    for line in lines(path):
        if line.startswith("[") and line.endswith("]"):
            active = line == f"[{name}]"
            continue
        if active:
            output.append(line)
    return output


def check_routing() -> None:
    module = SURGE / "modules/managed-routing.sgmodule"
    actual: list[tuple[str, str, str]] = []
    for line in section(module, "Rule"):
        parts = [part.strip() for part in line.split(",")]
        if len(parts) != 3 or parts[0] not in {"DOMAIN", "DOMAIN-SUFFIX"}:
            fail(f"invalid Surge routing rule: {line}")
            continue
        if parts[2] not in {"DIRECT", "REJECT"}:
            fail(f"module rule uses a non-internal policy: {line}")
        actual.append(tuple(parts))

    expected = (
        qx_rules(ROOT / "dist/managed-filter.list")
        + qx_rules(ROOT / "dist/abc-direct.list")
        + qx_rules(ROOT / "dist/douyin-commerce-direct.list")
    )
    if set(actual) != set(expected) or len(actual) != len(expected):
        fail("Surge routing module is not an exact translation of the three QX routing lists")

    mitm = section(module, "MITM")
    if len(mitm) != 1 or not mitm[0].startswith("hostname = %INSERT% "):
        fail("routing module must insert one ordered MitM exclusion list")
    for token in (
        "-appgologinhd.189.cn",
        "-appgologin.189.cn",
        "-*.abchina.com",
        "-*.abchina.com.cn",
        "-*.95599.cn",
        "-*.openaboc.com",
    ):
        if not mitm or token not in mitm[0]:
            fail(f"missing Surge MitM exclusion: {token}")


def check_ai() -> None:
    expected = qx_rules(ROOT / "dist/managed-ai.list")
    expected_chatgpt = {(kind, domain) for kind, domain, policy in expected if policy == "CHATGPT"}
    expected_services = {(kind, domain) for kind, domain, policy in expected if policy == "AI服务"}

    def read_set(relative: str) -> set[tuple[str, str]]:
        output: set[tuple[str, str]] = set()
        for line in lines(SURGE / relative):
            parts = [part.strip() for part in line.split(",")]
            if len(parts) != 2 or parts[0] not in {"DOMAIN", "DOMAIN-SUFFIX"}:
                fail(f"invalid external Surge rule: {relative}: {line}")
                continue
            output.add((parts[0], parts[1]))
        return output

    if read_set("rules/ai-chatgpt.list") != expected_chatgpt:
        fail("ChatGPT Surge rule set is not synchronized with dist/managed-ai.list")
    if read_set("rules/ai-services.list") != expected_services:
        fail("AI services Surge rule set is not synchronized with dist/managed-ai.list")

    include = lines(SURGE / "ai-routing.dconf")
    if len([line for line in include if line.startswith("RULE-SET,")]) != 2:
        fail("ai-routing.dconf must reference exactly two external rule sets")


def check_rewrite() -> None:
    module = SURGE / "modules/managed-rewrite.sgmodule"
    text = module.read_text(encoding="utf-8") if module.is_file() else ""
    for qx_token in (" url reject", "script-response-body", "script-request-body", "bodyBytes"):
        if qx_token in text:
            fail(f"Surge module contains Quantumult X-only token: {qx_token}")

    names: set[str] = set()
    for line in section(module, "Script"):
        if " = " not in line:
            fail(f"invalid Surge script declaration: {line}")
            continue
        name, params = line.split(" = ", 1)
        if name in names:
            fail(f"duplicate Surge script name: {name}")
        names.add(name)
        if "type=http-" not in params or "pattern=" not in params or "script-path=" not in params:
            fail(f"incomplete Surge script declaration: {name}")
        match = re.search(r"script-path=https://raw\.githubusercontent\.com/000Robin/quantumultx-rewrite-rules/main/(surge/scripts/[^,]+)", params)
        if not match:
            fail(f"script does not use the independent Surge path: {name}")
        elif not (ROOT / match.group(1)).is_file():
            fail(f"missing referenced Surge script: {match.group(1)}")

    for line in section(module, "Rule"):
        parts = line.rsplit(",", 1)
        if len(parts) != 2 or not line.startswith("URL-REGEX,") or parts[1] not in {"REJECT", "REJECT-TINYGIF"}:
            fail(f"invalid Surge rewrite rule: {line}")
            continue
        try:
            re.compile(line[len("URL-REGEX,") :].rsplit(",", 1)[0])
        except re.error as exc:
            fail(f"invalid URL-REGEX ({exc}): {line}")

    qx_host_line = next((line for line in lines(ROOT / "dist/managed-rewrite.snippet") if line.startswith("hostname =")), "")
    qx_hosts = {item.strip() for item in qx_host_line.split("=", 1)[-1].split(",") if item.strip()}
    surge_mitm = section(module, "MITM")
    if len(surge_mitm) != 1 or not surge_mitm[0].startswith("hostname = %INSERT% "):
        fail("rewrite module must insert exactly one MitM hostname line")
    else:
        surge_hosts = {item.strip() for item in surge_mitm[0].split("%INSERT%", 1)[1].split(",")}
        if surge_hosts != qx_hosts:
            fail("Surge rewrite MitM hostnames differ from the reviewed QX hostname set")
        if "*.189.cn" in surge_hosts or "*.ctyun.cn" in surge_hosts:
            fail("broad China Telecom MitM is forbidden")


def check_scripts() -> None:
    scripts = sorted((SURGE / "scripts").glob("*.js"))
    if len(scripts) != 9:
        fail(f"expected 9 independent Surge scripts, found {len(scripts)}")
    for path in scripts:
        text = path.read_text(encoding="utf-8")
        if ".bodyBytes" in text:
            fail(f"{path.relative_to(ROOT)} still uses Quantumult X bodyBytes")
        result = subprocess.run(["node", "--check", str(path)], capture_output=True, text=True)
        if result.returncode:
            fail(f"JavaScript syntax error in {path.relative_to(ROOT)}: {result.stderr.strip()}")


def check_sensitive_data() -> None:
    pattern = re.compile(
        r"(?im)^\s*(?:ca-p12|ca-passphrase|p12|passphrase)\s*=\s*\S+|"
        r"[?&](?:token|key|auth|owo)=[A-Za-z0-9._~-]{12,}|"
        r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"
    )
    for path in SURGE.rglob("*"):
        if path.is_file() and pattern.search(path.read_text(encoding="utf-8")):
            fail(f"{path.relative_to(ROOT)} contains possible sensitive material")


def main() -> int:
    check_routing()
    check_ai()
    check_rewrite()
    check_scripts()
    check_sensitive_data()
    if ERRORS:
        for error in ERRORS:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("Surge artifacts validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
