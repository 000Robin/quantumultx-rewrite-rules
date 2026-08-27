/*
 * Tencent Video in-app popup/ad card cleaner.
 * Scope: JSON responses from https://i.video.qq.com/ only.
 * It does not alter account, VIP, playback, or paid-access fields.
 */

const rawBody = $response.body || "";

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

const isExplicitAdNode = (value) => {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;

  return Object.entries(value).some(([key, fieldValue]) => {
    const normalizedKey = normalizeKey(key);
    if (adFlagKeys.has(normalizedKey)) return isTruthyAdValue(fieldValue);
    if (adIdKeys.has(normalizedKey)) return hasNonzeroId(fieldValue);

    if (adTypeKeys.has(normalizedKey) || typedNodeKeys.has(normalizedKey)) {
      const normalizedValue = normalizeKey(fieldValue);
      if (adTypeValues.has(normalizedValue)) return true;
    }

    return isKnownAdAsset(fieldValue);
  });
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

try {
  const parsed = JSON.parse(rawBody);
  $done({ body: JSON.stringify(clean(parsed)) });
} catch (_) {
  // Binary, JSONP, or malformed responses pass through unchanged.
  $done({ body: rawBody });
}
