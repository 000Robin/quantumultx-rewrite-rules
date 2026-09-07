/*
 * Mengdian e Home splash resource cleaner for Quantumult X.
 *
 * Scope: GET /hlwyy/business-mdej/sycd/queryResourcesList only.
 * The response also carries application update packages, so this script removes
 * only entries whose declared type and download path both identify an image.
 * Malformed or unexpected responses pass through unchanged.
 */

const rawBody = ($response && $response.body) || "";
const imageTypes = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

const isSplashImage = (item) => {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;

  const declaredType = String(item.wjlx || "").trim().toLowerCase();
  const filePath = String(item.fileFullPath || "").trim();
  if (!imageTypes.has(declaredType) || !filePath) return false;

  const escapedType = declaredType === "jpg" ? "jpe?g" : declaredType;
  return new RegExp(`\\.${escapedType}(?:[?#]|$)`, "i").test(filePath);
};

try {
  const payload = JSON.parse(rawBody);
  if (!payload || !Array.isArray(payload.data)) {
    $done({ body: rawBody });
  } else {
    const filtered = payload.data.filter((item) => !isSplashImage(item));
    if (filtered.length === payload.data.length) {
      $done({ body: rawBody });
    } else {
      payload.data = filtered;
      $done({ body: JSON.stringify(payload) });
    }
  }
} catch (_) {
  $done({ body: rawBody });
}
