/*
 * iScreen launch-ad configuration cleaner for Quantumult X.
 *
 * Scope: https://cs.kuso.xyz/configs and /configs2/default only.
 * The script changes only launch-ad controls confirmed by a 2026-09-15 HAR.
 * Content, feature, account and purchase data pass through unchanged.
 */

const rawBody = ($response && $response.body) || "";

const launchGroupCodes = new Set([
  "olaunch",
  "ocommon",
  "soversealaunch",
  "slaunch",
]);

const cleanLegacyConfig = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;

  let changed = false;
  if (Object.prototype.hasOwnProperty.call(data, "launchAd") && data.launchAd !== 0) {
    data.launchAd = 0;
    changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(data, "SplashTimeout") && data.SplashTimeout !== 0) {
    data.SplashTimeout = 0;
    changed = true;
  }
  return changed;
};

const cleanGroupedConfig = (data) => {
  const groups = data && data.ad_group_configs && data.ad_group_configs.content;
  if (!Array.isArray(groups)) return false;

  let changed = false;
  for (const group of groups) {
    if (!group || typeof group !== "object" || Array.isArray(group)) continue;
    const code = String(group.code || "").trim().toLowerCase();
    if (!launchGroupCodes.has(code)) continue;

    if (group.rate !== 0) {
      group.rate = 0;
      changed = true;
    }
    if (Object.prototype.hasOwnProperty.call(group, "maxDisplayCount") && group.maxDisplayCount !== 0) {
      group.maxDisplayCount = 0;
      changed = true;
    }
  }
  return changed;
};

try {
  const payload = JSON.parse(rawBody);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    $done({ body: rawBody });
  } else {
    const legacyChanged = cleanLegacyConfig(payload.data);
    const groupedChanged = cleanGroupedConfig(payload.data);
    const changed = legacyChanged || groupedChanged;
    $done({ body: changed ? JSON.stringify(payload) : rawBody });
  }
} catch (_) {
  $done({ body: rawBody });
}
