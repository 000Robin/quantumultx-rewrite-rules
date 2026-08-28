#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "youtube_ad_clean.js");
const script = fs.readFileSync(scriptPath, "utf8");

const run = ({ url, body, bodyBytes }) => {
  let completion;
  const response = {};
  if (body !== undefined) response.body = body;
  if (bodyBytes !== undefined) response.bodyBytes = bodyBytes;

  vm.runInNewContext(script, {
    $request: { url },
    $response: response,
    $done: (result = {}) => {
      completion = { ...result };
    },
    console,
    ArrayBuffer,
    Uint8Array,
    Number,
    Set,
  });

  assert.notEqual(completion, undefined, "script must call $done");
  return completion;
};

const concat = (...parts) => Uint8Array.from(parts.flat());
const safePlayerFields = concat(
  [0x12, 0x01, 0x41],
  [0x4a, 0x01, 0x42],
  [0x52, 0x01, 0x44]
);
const playerWithAds = concat(
  [0x12, 0x01, 0x41],
  [0x3a, 0x02, 0xaa, 0xbb],
  [0x4a, 0x01, 0x42],
  [0xa2, 0x04, 0x01, 0xcc],
  [0x52, 0x01, 0x44]
);

const binaryResult = run({
  url: "https://youtubei.googleapis.com/youtubei/v1/player?key=test",
  bodyBytes: playerWithAds.buffer,
});
assert.deepEqual(
  Array.from(new Uint8Array(binaryResult.bodyBytes)),
  Array.from(safePlayerFields),
  "player ad placement fields must be removed and all other bytes preserved"
);

assert.deepEqual(
  run({
    url: "https://youtubei.googleapis.com/youtubei/v1/browse",
    bodyBytes: playerWithAds.buffer,
  }),
  {},
  "non-player protobuf responses must pass through unchanged"
);

assert.deepEqual(
  run({
    url: "https://youtubei.googleapis.com/youtubei/v1/player",
    bodyBytes: Uint8Array.from([0x3a, 0x05, 0x01]).buffer,
  }),
  {},
  "malformed protobuf must pass through unchanged"
);

const jsonResult = run({
  url: "https://youtubei.googleapis.com/youtubei/v1/next",
  body: JSON.stringify({
    streamingData: { formats: [{ itag: 18, url: "https://media.example/video" }] },
    playabilityStatus: { status: "OK" },
    videoDetails: { videoId: "safe-video", title: "Keep me" },
    adPlacements: [{ adPlacementRenderer: { config: "remove" } }],
    adSlots: [{ slotId: "remove" }],
    contents: [
      { videoRenderer: { videoId: "safe-video" } },
      { adSlotRenderer: { slotId: "remove" } },
      { sectionRenderer: { contents: [{ promotedVideoRenderer: { id: "remove" } }] } },
    ],
  }),
});
const cleaned = JSON.parse(jsonResult.body);
assert.equal(cleaned.adPlacements, undefined);
assert.equal(cleaned.adSlots, undefined);
assert.equal(cleaned.contents.length, 2);
assert.deepEqual(cleaned.contents[0], { videoRenderer: { videoId: "safe-video" } });
assert.deepEqual(cleaned.contents[1], { sectionRenderer: { contents: [] } });
assert.equal(cleaned.streamingData.formats[0].itag, 18);
assert.equal(cleaned.playabilityStatus.status, "OK");
assert.equal(cleaned.videoDetails.videoId, "safe-video");

assert.deepEqual(
  run({
    url: "https://youtubei.googleapis.com/youtubei/v1/player",
    body: "{not-json",
  }),
  {},
  "malformed JSON must pass through unchanged"
);

console.log("YouTube ad cleaner tests passed.");
