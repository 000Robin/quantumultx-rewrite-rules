/*
 * Tencent Video request-stage ad/promotion cleaner.
 * Scope: binary requests to https://i.video.qq.com/ only.
 * It rejects two HAR-confirmed ad/popup RPCs and neutralizes the explicit
 * AdRequestContextInfo protobuf Any type with an equal-length substitution.
 */

const rawBodyBytes = $request.body instanceof Uint8Array ? $request.body : null;
const rawBody = typeof $request.body === "string" ? $request.body : "";

const toAsciiBytes = (value) => {
  const output = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    output[index] = value.charCodeAt(index);
  }
  return output;
};

const containsBytes = (source, text) => {
  const search = toAsciiBytes(text);
  for (let offset = 0; offset <= source.length - search.length; offset += 1) {
    let matched = true;
    for (let index = 0; index < search.length; index += 1) {
      if (source[offset + index] !== search[index]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
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

const confirmedAdServices = [
  "trpc.reward_ad_ssp.reward_ad_ssp_service.adService",
  "trpc.activity.memberExperience.ActivityTcp/getHomeGrowPopupUrl",
];

const sourceBytes = rawBodyBytes instanceof Uint8Array
  ? rawBodyBytes
  : toAsciiBytes(rawBody);
const matchedAdService = confirmedAdServices.some(
  (service) => rawBody.includes(service) || containsBytes(sourceBytes, service)
);

if (matchedAdService) {
  $done({
    response: {
      status: 204,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/octet-stream",
      },
      body: "",
    },
  });
} else if (!(rawBodyBytes instanceof Uint8Array)) {
  $done({});
} else {
  const output = rawBodyBytes.slice();
  const marker = "no_show_update_tip";
  const markerBytes = new Uint8Array(marker.length);
  for (let index = 0; index < marker.length; index += 1) {
    markerBytes[index] = marker.charCodeAt(index);
  }

  let changed = false;
  for (let offset = 0; offset <= output.length - markerBytes.length - 3; offset += 1) {
    let matched = true;
    for (let index = 0; index < markerBytes.length; index += 1) {
      if (output[offset + index] !== markerBytes[index]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;

    const valueOffset = offset + markerBytes.length;
    // Protobuf string field: tag 0x12, length 1, ASCII "0".
    if (
      output[valueOffset] === 0x12 &&
      output[valueOffset + 1] === 0x01 &&
      output[valueOffset + 2] === 0x30
    ) {
      output[valueOffset + 2] = 0x31;
      changed = true;
    }
  }

  // The 2026-09-15 HAR shows this Any type only inside the main MVL page
  // request. Equal-length renaming keeps the protobuf frame intact while
  // preventing the server from treating the nested payload as ad context.
  changed = replaceAllBytes(
    output,
    "com.tencent.qqlive.protocol.pb.AdRequestContextInfo",
    "com.tencent.qqlive.protocol.pb.NoRequestContextInfo"
  ) > 0 || changed;

  $done(changed ? { body: output } : {});
}
