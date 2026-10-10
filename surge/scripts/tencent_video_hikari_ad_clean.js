/*
 * Tencent Video Hikari reward/interactive-ad template cleaner for Surge.
 * Scope is limited by the module to production Hikari template JSON.
 */

const rawBody = typeof $response.body === "string" ? $response.body : "";

const explicitAdMarkers = [
  "adData.rewardAd",
  "state.rewardAd",
  "RewardVideo",
  "RewardAdTopClose",
];

const hiddenRoot = (id) => ({
  id,
  type: "FrameContainer",
  width: "100%",
  height: "100%",
  visible: false,
  children: [],
});

if (!rawBody || !explicitAdMarkers.some((marker) => rawBody.includes(marker))) {
  $done({});
} else {
  try {
    JSON.parse(rawBody);
    $done({
      body: JSON.stringify({
        vertical: hiddenRoot("root"),
        horizontal: hiddenRoot("root-horizontal"),
        config: {
          id: "ConfigRoot",
          type: "ConfigContainer",
          children: [],
        },
      }),
    });
  } catch (_) {
    $done({});
  }
}
