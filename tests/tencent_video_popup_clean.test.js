#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "tencent_video_popup_clean.js");
const script = fs.readFileSync(scriptPath, "utf8");

const run = (body, bodyBytes) => {
  let completion;
  vm.runInNewContext(script, {
    $response: { body, bodyBytes },
    $done: (result = {}) => {
      completion = { ...result };
    },
    console,
    Object,
    Set,
    Uint8Array,
    ArrayBuffer,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion;
};

const fixture = [
  {
    page: {
      account: { nick: "Juan", deviceCount: 4 },
      vip: { level: "V6", expireDate: "2028-05-22" },
      playback: { currentVideoId: "safe-video", position: 183 },
      sections: [
        {
          sectionId: "watch-history",
          title: "观看历史",
          items: [
            { videoId: "history-1", title: "地球超新鲜 第2季" },
            { videoId: "history-2", title: "半熟恋人 第5季" },
          ],
        },
        {
          sectionId: "native-promo-card",
          payload: {
            cornerMark: { text: "广告" },
            title: "示例商业推广文案",
            action: { text: "了解更多", url: "https://ad.example/landing" },
          },
        },
        {
          sectionId: "normal-content",
          title: "广告创意纪录片",
          action: { text: "查看详情" },
        },
        {
          sectionId: "structured-ad",
          isAd: 1,
          title: "remove structured ad",
        },
      ],
    },
  },
];

const result = run(JSON.stringify(fixture));
const cleaned = JSON.parse(result.body);
const page = cleaned[0].page;

assert.deepEqual(page.account, fixture[0].page.account);
assert.deepEqual(page.vip, fixture[0].page.vip);
assert.deepEqual(page.playback, fixture[0].page.playback);
assert.equal(page.sections.length, 2);
assert.equal(page.sections[0].sectionId, "watch-history");
assert.deepEqual(page.sections[0].items, fixture[0].page.sections[0].items);
assert.equal(page.sections[1].sectionId, "normal-content");

const malformed = "{not-json";
assert.equal(run(malformed).body, malformed, "malformed JSON must pass through unchanged");

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const binaryFixtureText = [
  "qqlive_rsp_head",
  "type.googleapis.com/com.tencent.qqlive.protocol.pb.AdFeedInfo",
  "type.googleapis.com/com.tencent.qqlive.protocol.pb.AdFocusPoster",
  "type.googleapis.com/com.tencent.qqlive.protocol.pb.AdJumpAction",
  "ad_block_2",
  "poster_focus_card",
  "watch_history",
  "vip_identity",
  "playback",
].join("\u0000");
const binaryFixture = encoder.encode(binaryFixtureText);
const binaryResult = run(undefined, binaryFixture.buffer);
assert.ok(binaryResult.bodyBytes instanceof ArrayBuffer);
assert.equal(binaryResult.bodyBytes.byteLength, binaryFixture.byteLength);
const cleanedBinaryText = decoder.decode(binaryResult.bodyBytes);
assert.equal(cleanedBinaryText.includes("protocol.pb.Ad"), false);
assert.equal(cleanedBinaryText.includes("ad_block_"), false);
assert.match(cleanedBinaryText, /protocol\.pb\.NoFeedInfo/);
assert.match(cleanedBinaryText, /protocol\.pb\.NoFocusPoster/);
assert.match(cleanedBinaryText, /protocol\.pb\.NoJumpAction/);
assert.match(cleanedBinaryText, /no_block_2/);
assert.match(cleanedBinaryText, /poster_focus_card/);
assert.match(cleanedBinaryText, /watch_history/);
assert.match(cleanedBinaryText, /vip_identity/);
assert.match(cleanedBinaryText, /playback/);

const unknownBinary = encoder.encode("qqlive_rsp_head\u0000poster_focus_card");
assert.deepEqual(
  run(undefined, unknownBinary.buffer),
  {},
  "unrecognized binary payload must pass through unchanged"
);

console.log("Tencent Video popup cleaner tests passed.");
