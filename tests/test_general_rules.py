"""Regression checks for specialist conflicts and broad host matches. GPL-3.0."""
import importlib.util
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('general', ROOT / 'tools/build_general_rules.py')
general = importlib.util.module_from_spec(spec)
spec.loader.exec_module(general)


class GeneralRulesTests(unittest.TestCase):
    def test_reviewed_web_ads_keep_normal_pages_and_subdomains(self):
        outputs = general.build()
        filters = outputs[ROOT / 'dist/general-filter.list']
        for host in ('a.realsrv.com', 'ad.vidverto.io', 'img.ad-nex.com'):
            self.assertIn('host, ' + host + ', reject', filters)
            self.assertNotIn('host-suffix, ' + host + ', reject', filters)
        rewrite = outputs[ROOT / 'dist/general-rewrite.snippet']
        for url, normal in (
            ('https://www.novel543.com/log/ad.html', 'https://www.novel543.com/chapter/123.html'),
            ('https://assert.avple.tv/file/avple-images/ad.js', 'https://assert.avple.tv/file/avple-images/player.js'),
        ):
            matches = [l.split()[0] for l in rewrite.splitlines() if l.startswith('^') and re.search(l.split()[0], url)]
            self.assertEqual(len(matches), 1)
            self.assertIsNone(re.search(matches[0], normal))

    def test_domain_boundaries_and_ancestor_conflicts(self):
        self.assertTrue(general.overlaps('12306.cn', 'ad.12306.cn'))
        self.assertTrue(general.overlaps('ad.12306.cn', '12306.cn'))
        self.assertFalse(general.overlaps('evil12306.cn', '12306.cn'))
        self.assertFalse(general.overlaps('12306.cn.evil.net', '12306.cn'))
        self.assertTrue(general.overlaps('appgologinhd.189.cn', 'appgologin*.189.cn'))

    def test_unbounded_authorities_are_rejected(self):
        for pattern in (r'(?i)\badvertisement', r'^https?://.*foo.com/ads', r'^https?://(foo|bar)\.com/ad', r'^https?://foo.com.evil:443/ad'):
            self.assertIsNone(general.literal_host(pattern))

    def test_important_services_not_blocked(self):
        outputs = general.build()
        filters = outputs[ROOT / 'dist/general-filter.list']
        protected = ['ad.12306.cn', 'afd.baidu.com', 'api.statsig.com', 'api-access.pangolin-sdk-toutiao.com',
                     'appgologinhd.189.cn', 'wallet.95516.com', 'vcs-lf.zijieapi.com', 'ecomuser.snssdk.com',
                     'i.video.qq.com', 'vv.video.qq.com', 'autoload.bank.ecitic.com', 'api.pinduoduo.com']
        for line in filters.splitlines():
            if line.startswith('#') or not line.strip():
                continue
            kind, host, _ = [v.strip() for v in line.split(',')]
            for service in protected:
                self.assertFalse(service == host or (kind == 'host-suffix' and service.endswith('.' + host)), (line, service))
        for line in outputs[ROOT / 'dist/general-rewrite.snippet'].splitlines():
            if not line.startswith('^'):
                continue
            regex = line.split()[0]
            host, _ = general.literal_host(regex)
            self.assertFalse(any(general.overlaps(host, service) for service in protected), host)
            self.assertIsNone(re.search(regex, 'https://' + host + '.evil.net/ads/splash'))

    def test_filter_does_not_preempt_general_rewrites(self):
        outputs = general.build()
        rules = [line.split(', ')[:2] for line in outputs[ROOT / 'dist/general-filter.list'].splitlines() if line.startswith('host')]
        for line in outputs[ROOT / 'dist/general-rewrite.snippet'].splitlines():
            if line.startswith('^'):
                host, _ = general.literal_host(line.split()[0])
                self.assertFalse(any(host == domain or (kind == 'host-suffix' and host.endswith('.' + domain)) for kind, domain in rules), host)


if __name__ == '__main__':
    unittest.main()
