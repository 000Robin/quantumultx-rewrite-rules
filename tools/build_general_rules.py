#!/usr/bin/env python3
"""Build conservative general supplements, excluding specialist ownership.

Offline, reproducible snapshots; no upstream update is silently enabled.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'sources/general'
DOMAIN = re.compile(r'(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$', re.I)
AD_PATH = re.compile(r'(?i:advert|splash|start(?:up|page)|launch|banner|promotion|(?:^|[/_\W])ads?(?:[/_\W]|$))|[Aa]d[A-Z]|[Aa]ds')


def host_guards(text):
    result = set()
    for line in text.splitlines():
        m = re.match(r'\s*hostname\s*=\s*(.*)', line, re.I)
        if m:
            result.update(x.strip().lstrip('-').lower() for x in m[1].split(',') if x.strip())
        m = re.match(r'\s*(?:host|host-suffix)\s*,\s*([^,]+),', line, re.I)
        if m:
            result.add(m[1].strip().lower())
    return result


def overlaps(domain, guard):
    """Conservative domain boundary intersection, including ancestor suffix rules.

    A wildcard host is widened only in the exclusion set, never in output rules.
    """
    guard = guard.lower().lstrip('-')
    if guard.endswith('*'):
        return guard.strip('*') in domain
    guard = guard.rsplit('*', 1)[-1].lstrip('.')
    return bool(guard) and (domain == guard or domain.endswith('.' + guard) or guard.endswith('.' + domain))


def owned(domain, guards):
    return any(overlaps(domain, guard) for guard in guards)


def literal_host(pattern):
    """Only anchored http(s) patterns with an exact DNS authority and path."""
    normalized = pattern.replace(r'\/', '/').replace(r'\.', '.').replace(r'\-', '-')
    m = re.match(r'^\^http(?:s\??)?://([^/]+)/(.+)$', normalized)
    if not m:
        return None
    host = m[1].lower()
    return (host, m[2]) if DOMAIN.fullmatch(host) else None


def build():
    manifest = json.loads((SOURCE / 'exclusions.json').read_text(encoding='utf-8'))
    for source in manifest['sources']:
        normalized = (SOURCE / source['file']).read_text(encoding='utf-8').encode('utf-8')
        if hashlib.sha256(normalized).hexdigest() != source['sha256']:
            raise ValueError('Source snapshot hash mismatch: ' + source['file'])
    guards = set(manifest['family_exclusions'] + manifest['profile_host_exclusions'])
    for values in manifest['external_host_exclusions'].values():
        guards.update(values)
    paths = list((ROOT / 'dist/filter').glob('*.list')) + list((ROOT / 'dist/rewrite').glob('*.snippet'))
    paths += [ROOT / 'dist' / name for name in ('managed-ai.list', 'douyin-commerce-direct.list', 'abc-direct.list')]
    for path in paths:
        guards.update(host_guards(path.read_text(encoding='utf-8')))
    counts = {'rewrite': Counter(), 'filter': Counter()}
    rewrites, rewrite_hosts, seen = [], set(), set()
    for line in ((SOURCE / 'blackmatrix.conf').read_text(encoding='utf-8-sig') + '\n' + (SOURCE / 'limbopro-rewrite.conf').read_text(encoding='utf-8-sig')).splitlines():
        line = line.strip()
        if not line or line.startswith('#') or line.startswith('hostname'):
            continue
        counts['rewrite']['input'] += 1
        m = re.fullmatch(r'(\S+)\s+url\s+(reject(?:-200|-img|-dict|-array)?)', line)
        parsed = literal_host(m[1]) if m else None
        if not parsed:
            counts['rewrite']['nonliteral_or_unsupported'] += 1
            continue
        host, path = parsed
        if owned(host, guards):
            counts['rewrite']['specialist_or_protected'] += 1
            continue
        if '|' in path:
            counts['rewrite']['mixed_alternatives_need_manual_review'] += 1
            continue
        if not AD_PATH.search(path):
            counts['rewrite']['no_explicit_ad_path'] += 1
            continue
        # Pin the authority literally even when the source left dots unescaped.
        # Preserve the path regex and response action; escaped slashes are equivalent.
        parts = re.match(r'^(\^http(?:s\??)?://)[^/]+/(.+)$', m[1].replace(r'\/', '/'))
        pattern = parts[1] + re.escape(host) + '/' + parts[2]
        re.compile(pattern)
        if pattern in seen:
            counts['rewrite']['duplicate_pattern'] += 1
            continue
        seen.add(pattern)
        rewrites.append(f'{pattern} url {m[2]}')
        if not m[1].startswith('^http:'):
            rewrite_hosts.add(host)
    all_rewrite_hosts = {literal_host(line.split()[0])[0] for line in rewrites}
    candidates = set()
    for line in ((SOURCE / 'awa.list').read_text(encoding='utf-8-sig') + '\n' + (SOURCE / 'limbopro-filter.list').read_text(encoding='utf-8-sig')).splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        counts['filter']['input'] += 1
        m = re.fullmatch(r'(DOMAIN|DOMAIN-SUFFIX|host|host-suffix)\s*,\s*([^,]+),\s*reject', line, re.I)
        if not m or not DOMAIN.fullmatch(m[2]):
            counts['filter']['unsupported_or_invalid'] += 1
            continue
        kind = 'host-suffix' if m[1].lower() in ('domain-suffix', 'host-suffix') else 'host'
        domain = m[2].lower()
        if owned(domain, guards):
            counts['filter']['specialist_or_protected'] += 1
            continue
        if any(domain == h or (kind == 'host-suffix' and h.endswith('.' + domain)) for h in all_rewrite_hosts):
            counts['filter']['preserve_general_rewrite'] += 1
            continue
        if (kind, domain) in candidates:
            counts['filter']['duplicate'] += 1
        candidates.add((kind, domain))
    suffixes = {domain for kind, domain in candidates if kind == 'host-suffix'}
    filters = []
    for kind, domain in sorted(candidates, key=lambda x: (x[1], x[0])):
        parts = domain.split('.')
        if any('.'.join(parts[i:]) in suffixes for i in range(1, len(parts))) or (kind == 'host' and domain in suffixes):
            counts['filter']['covered_by_suffix'] += 1
            continue
        filters.append(f'{kind}, {domain}, reject')
    counts['rewrite']['output'] = len(rewrites)
    counts['filter']['output'] = len(filters)
    def header(kind, license_name, author):
        return '\n'.join([
            '#!name=Robin | 通用去广补充（排除专用）' + kind,
            '#!desc=与 v8.21 专用模块配套使用；静态审查通过，实际效果需冷启动验证。',
            '#!date=' + manifest['date'],
            '# Upstream: ' + author,
            '# Additional reviewed rules: limbopro/Adblock4limbo (MIT); see sources/general/LICENSE-limbopro-MIT.txt.',
            '# Modified by 000Robin: specialist exclusions, conservative scope and deduplication.',
            '# License: ' + license_name + '; repository personal-use restrictions do not apply.',
            '# Sources, corresponding build inputs and licenses: sources/general/',
        ]) + '\n\n'
    outputs = {
        ROOT / 'dist/general-filter.list': header('分流', 'GPL-3.0', manifest['sources'][0]['url']) + '\n'.join(filters) + '\n',
        ROOT / 'dist/general-rewrite.snippet': header('重写', 'GPL-2.0', manifest['sources'][1]['url']) + '\n'.join(rewrites) + '\n\nhostname = ' + ', '.join(sorted(rewrite_hosts)) + '\n',
    }
    report = {
        'date': manifest['date'], 'counts': counts,
        'protected_host_patterns': len(guards), 'general_mitm_hosts': len(rewrite_hosts),
        'device_tested': False,
        'scope': 'Only literal-host reject rewrites with ad-related paths. All specialist host scopes are excluded conservatively, not only identical rules.',
        'not_used': {'217heidai': 'Large aggregate omitted to limit unrelated blocking.', 'ddgksf2013.top/StartUpAds.conf': 'HTTP 200 HTML page, not a rewrite resource.'},
    }
    outputs[ROOT / 'sources/general/report.json'] = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    return outputs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    outputs = build()
    if args.check:
        stale = [str(path.relative_to(ROOT)) for path, text in outputs.items() if not path.exists() or path.read_text(encoding='utf-8') != text]
        if stale:
            raise SystemExit('General resources are stale: ' + ', '.join(stale))
        print('General resources are current; source hashes and specialist exclusions verified.')
    else:
        for path, text in outputs.items():
            path.write_text(text, encoding='utf-8')
        print(outputs[ROOT / 'sources/general/report.json'])


if __name__ == '__main__':
    main()
