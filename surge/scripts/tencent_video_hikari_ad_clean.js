/*
 * Hikari ad templates: request-stage echo is bound to 86 HAR-confirmed filenames across two captures.
 * Response-stage cleaning covers new explicitly typed ad templates.
 * Normal or malformed response bodies pass through unchanged.
 */
const requestStage = typeof $response === "undefined";
const rawBody = !requestStage && typeof $response.body === "string" ? $response.body : "";
const explicitAdMarkers = ["adData.rewardAd", "state.rewardAd", "RewardVideo", "RewardAdTopClose"];
const hiddenRoot = (id) => ({ id, type: "FrameContainer", width: "100%", height: "100%", visible: false, children: [] });
const hiddenBody = () => JSON.stringify({
  vertical: hiddenRoot("root"),
  horizontal: hiddenRoot("root-horizontal"),
  config: { id: "ConfigRoot", type: "ConfigContainer", children: [] },
});
const cleanHeaders = (original) => {
  const headers = {};
  const stale = new Set(["cache-control", "pragma", "expires", "etag", "last-modified", "content-length", "content-encoding", "content-type"]);
  for (const [key, value] of Object.entries(original || {})) {
    if (!stale.has(key.toLowerCase())) headers[key] = value;
  }
  headers["Content-Type"] = "application/json; charset=utf-8";
  headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
  headers.Pragma = "no-cache";
  headers.Expires = "0";
  return headers;
};
if (requestStage) {
  $done({ response: { status: 200, headers: cleanHeaders({}), body: hiddenBody() } });
} else if (!rawBody || !explicitAdMarkers.some((marker) => rawBody.includes(marker))) {
  $done({});
} else {
  try {
    JSON.parse(rawBody);
    $done({ headers: cleanHeaders($response.headers), body: hiddenBody() });
  } catch (_) {
    $done({});
  }
}
