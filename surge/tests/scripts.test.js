"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scriptRoot = path.resolve(__dirname, "../scripts");

function run(name, globals) {
  const source = fs.readFileSync(path.join(scriptRoot, name), "utf8");
  let result;
  const context = {
    Uint8Array,
    TextDecoder,
    TextEncoder,
    console,
    $done(value = {}) {
      result = value;
    },
    ...globals,
  };
  vm.runInNewContext(source, context, { filename: name });
  assert.notStrictEqual(result, undefined, `${name} did not call $done`);
  return result;
}

{
  const result = run("empty_json_response.js", { $request: { url: "https://example.test/ad" } });
  assert.strictEqual(result.response.status, 200);
  assert.strictEqual(result.response.body, "{}");
}

{
  const result = run("railway_12306_splash_clean.js", {
    $request: { body: JSON.stringify({ placementNo: "0007" }) },
  });
  const payload = JSON.parse(result.response.body);
  assert.strictEqual(result.response.status, 200);
  assert.strictEqual(payload.advertParam.skipTime, 0);
}

{
  const marker = "trpc.reward_ad_ssp.reward_ad_ssp_service.adService";
  const result = run("tencent_video_request_clean.js", {
    $request: { body: new TextEncoder().encode(marker) },
  });
  assert.strictEqual(result.response.status, 204);
}

{
  const body = new TextEncoder().encode(JSON.stringify({
    data: {
      cards: [
        { title: "观看历史", items: [1] },
        { badge: "广告", action: "了解更多", title: "推广" },
      ],
    },
  }));
  const result = run("tencent_video_popup_clean.js", { $response: { body } });
  const payload = JSON.parse(result.body);
  assert.strictEqual(payload.data.cards.length, 1);
  assert.strictEqual(payload.data.cards[0].title, "观看历史");
}

{
  const body = new TextEncoder().encode(JSON.stringify({
    videoDetails: { videoId: "safe" },
    playerAds: [{ id: "ad" }],
  }));
  const result = run("youtube_ad_clean.js", {
    $request: { url: "https://youtubei.googleapis.com/youtubei/v1/player" },
    $response: { body },
  });
  const payload = JSON.parse(result.body);
  assert.strictEqual(payload.videoDetails.videoId, "safe");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(payload, "playerAds"), false);
}

console.log("Surge script adapter tests passed.");
