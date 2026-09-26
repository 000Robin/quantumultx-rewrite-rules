/*
 * Baidu Netdisk splash-ad response cleaner for Surge.
 *
 * Scope: https://afd.baidu.com/afd/entry?action=query only.
 * A 2026-09-26 HAR captured both the service's valid no-ad response and a
 * splash response. Preserve the response envelope and clear only the ad list.
 */

const rawBody = ($response && $response.body) || "";

try {
  const payload = JSON.parse(rawBody);
  const result = payload && payload.res;
  if (!result || typeof result !== "object" || Array.isArray(result) || !Array.isArray(result.ad)) {
    $done({ body: rawBody });
  } else if (result.ad.length === 0) {
    $done({ body: rawBody });
  } else {
    result.ad = [];
    if (Object.prototype.hasOwnProperty.call(result, "splash")) delete result.splash;
    $done({ body: JSON.stringify(payload) });
  }
} catch (_) {
  $done({ body: rawBody });
}
