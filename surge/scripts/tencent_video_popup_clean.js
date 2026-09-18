/*
 * Tencent Video in-app popup/ad card cleaner.
 * Scope: JSON and binary responses from https://i.video.qq.com/ only.
 * It does not alter account, VIP, playback, or paid-access fields.
 */

const rawBody = $response.body;
const rawBodyBytes = rawBody instanceof Uint8Array ? rawBody : null;

const toAsciiBytes = (value) => {
  const output = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    output[index] = value.charCodeAt(index);
  }
  return output;
};

const replaceAllBytes = (source, searchText, replacementText) => {
  if (searchText.length !== replacementText.length) return 0;
  const search = toAsciiBytes(searchText);
  const replacement = toAsciiBytes(replacementText);
  let replacements = 0;

  for (let offset = 0; offset <= source.length - search.length; offset += 1) {
    let matched = true;
    for (let index = 0; index < search.length; index += 1) {
      if (source[offset + index] !== search[index]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;

    source.set(replacement, offset);
    replacements += 1;
    offset += search.length - 1;
  }

  return replacements;
};

const cleanBinaryAdTypes = (bodyBytes) => {
  if (!(bodyBytes instanceof Uint8Array)) return null;
  const output = bodyBytes.slice();
  let replacements = 0;

  // Tencent's protobuf Any type names and MVL module titles are length-prefixed.
  // Same-length substitutions preserve every surrounding binary length field while
  // making only explicitly typed ad payloads unavailable to the client.
  replacements += replaceAllBytes(
    output,
    "com.tencent.qqlive.protocol.pb.Ad",
    "com.tencent.qqlive.protocol.pb.No"
  );
  replacements += replaceAllBytes(output, "ad_block_", "no_block_");

  return replacements > 0 ? output : null;
};

const normalizeKey = (key) => String(key).replace(/[^a-z0-9]/gi, "").toLowerCase();

const adContainerKeys = new Set([
  "ad",
  "ads",
  "adlist",
  "adlists",
  "adinfo",
  "adinfos",
  "addata",
  "advert",
  "adverts",
  "advertisement",
  "advertisements",
  "advertising",
  "popupad",
  "popupads",
  "floatingad",
  "floatingads",
  "floatad",
  "floatads",
  "bannerad",
  "bannerads",
  "interactivead",
  "interactiveads",
  "rewardad",
  "rewardads",
  "marketingpopup",
  "marketingpopups",
  "commercialad",
  "commercialads",
]);

const adFlagKeys = new Set(["isad", "isadvert", "isadvertisement"]);
const adIdKeys = new Set(["adid", "advertid", "advertisementid", "creativeadid"]);
const adTypeKeys = new Set(["adtype", "adtag", "adsource"]);
const typedNodeKeys = new Set(["itemtype", "cardtype", "moduletype", "componenttype"]);
const adTypeValues = new Set([
  "ad",
  "ads",
  "advert",
  "advertisement",
  "advertising",
  "popupad",
  "floatingad",
  "bannerad",
  "interactivead",
  "rewardad",
  "marketingad",
  "commercialad",
]);

// Native cards on the profile page may omit ad IDs and expose only UI labels.
// Requiring both labels avoids matching ordinary content that merely mentions ads.
const nativeAdBadgeText = "广告";
const nativeAdActionText = "了解更多";
const protectedHistoryText = "观看历史";

const isTruthyAdValue = (value) => {
  if (value === true || value === 1) return true;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

const hasNonzeroId = (value) => {
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "null";
};

const isKnownAdAsset = (value) =>
  typeof value === "string" &&
  /\/(?:promotionTest|starter)\//i.test(value);

const hasNativeAdCardSignature = (value) => {
  const stack = [value];
  let hasAdBadge = false;
  let hasAdAction = false;
  let containsWatchHistory = false;

  while (stack.length) {
    const current = stack.pop();
    if (typeof current === "string") {
      const text = current.trim();
      if (text === nativeAdBadgeText) hasAdBadge = true;
      if (text === nativeAdActionText) hasAdAction = true;
      if (text === protectedHistoryText) containsWatchHistory = true;
      continue;
    }

    if (!current || typeof current !== "object") continue;
    for (const child of Object.values(current)) stack.push(child);
  }

  return hasAdBadge && hasAdAction && !containsWatchHistory;
};

const isExplicitAdNode = (value) => {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;

  const hasStructuredAdMarker = Object.entries(value).some(([key, fieldValue]) => {
    const normalizedKey = normalizeKey(key);
    if (adFlagKeys.has(normalizedKey)) return isTruthyAdValue(fieldValue);
    if (adIdKeys.has(normalizedKey)) return hasNonzeroId(fieldValue);

    if (adTypeKeys.has(normalizedKey) || typedNodeKeys.has(normalizedKey)) {
      const normalizedValue = normalizeKey(fieldValue);
      if (adTypeValues.has(normalizedValue)) return true;
    }

    return isKnownAdAsset(fieldValue);
  });

  return hasStructuredAdMarker || hasNativeAdCardSignature(value);
};

const emptyLike = (value) => {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return {};
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return null;
};

const clean = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => !isExplicitAdNode(item)).map(clean);
  }
  if (!value || typeof value !== "object") return value;

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (adContainerKeys.has(normalizeKey(key))) {
      output[key] = emptyLike(child);
    } else {
      output[key] = clean(child);
    }
  }
  return output;
};

const cleanedBinary = cleanBinaryAdTypes(rawBodyBytes);
if (cleanedBinary) {
  $done({ body: cleanedBinary });
} else {
  try {
    const textBody = typeof rawBody === "string"
      ? rawBody
      : new TextDecoder().decode(rawBodyBytes || new Uint8Array());
    const parsed = JSON.parse(textBody);
    $done({ body: JSON.stringify(clean(parsed)) });
  } catch (_) {
    // Unknown binary, JSONP, or malformed responses pass through unchanged.
    $done({});
  }
}
