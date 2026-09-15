/*
 * Zhaopin splash/commercial response cleaner.
 * Scope is limited by the managed snippet to six previously observed endpoints.
 * It preserves response envelopes and non-ad home/experiment configuration.
 */

const rawBody = $response.body || "";
const requestUrl = ($request && $request.url) || "";

const emptyLike = (value) => {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return {};
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return null;
};

const normalizeKey = (key) => String(key).replace(/[^a-z0-9]/gi, "").toLowerCase();

const adContainers = new Set([
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
  "banner",
  "banners",
  "bannerad",
  "bannerads",
  "commercial",
  "commercialize",
  "launchad",
  "launchads",
  "marketingpopup",
  "popupad",
  "popupads",
  "splash",
  "splashad",
  "splashads",
  "startupad",
  "startupads",
]);

const adFlags = new Set([
  "adenable",
  "adenabled",
  "advertisingenable",
  "commercialenable",
  "enablead",
  "enableads",
  "enablelaunchad",
  "enablesplash",
  "isad",
  "isadvert",
  "iscommercial",
  "showad",
  "showads",
  "showlaunchad",
  "showsplash",
]);

const cleanConfig = (value) => {
  if (Array.isArray(value)) return value.map(cleanConfig);
  if (!value || typeof value !== "object") return value;

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeKey(key);
    if (adContainers.has(normalized)) {
      output[key] = emptyLike(child);
    } else if (adFlags.has(normalized)) {
      output[key] = emptyLike(child);
    } else {
      output[key] = cleanConfig(child);
    }
  }
  return output;
};

const clearAdEndpointPayload = (value) => {
  if (Array.isArray(value)) return [];
  if (!value || typeof value !== "object") return emptyLike(value);

  const output = { ...value };
  let foundPayload = false;
  for (const key of Object.keys(output)) {
    const normalized = normalizeKey(key);
    if (["data", "result", "rows", "items", "list", "records"].includes(normalized)) {
      output[key] = emptyLike(output[key]);
      foundPayload = true;
    }
    if (["count", "total", "totalcount", "pagesize"].includes(normalized)) {
      output[key] = 0;
    }
  }
  if (!foundPayload) output.data = [];
  return output;
};

try {
  const parsed = JSON.parse(rawBody);
  const adOnlyEndpoint = /\/(?:capi\/commercialize\/getConfig|positionbusiness\/exposure\/extExposureUser|operation\/ad\/(?:bidMainPage|getAdRecommend|bidAdvertisingInformation|listMyBannerAd)|operation\/operationAd\/getJdCardAd)(?:\?|$)/.test(requestUrl);
  const cleaned = adOnlyEndpoint ? clearAdEndpointPayload(parsed) : cleanConfig(parsed);
  $done({ body: JSON.stringify(cleaned) });
} catch (_) {
  // Unknown or malformed payloads pass through; never replace core data blindly.
  $done({ body: rawBody });
}
