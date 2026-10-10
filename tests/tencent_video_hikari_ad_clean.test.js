#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

for (const variant of ["scripts", "surge/scripts"]) {
  const source = fs.readFileSync(
    path.join(__dirname, "..", variant, "tencent_video_hikari_ad_clean.js"),
    "utf8"
  );
  const run = (body) => {
    let completion;
    let calls = 0;
    vm.runInNewContext(source, {
      $response: { body },
      $done: (result = {}) => {
        completion = JSON.parse(JSON.stringify(result));
        calls += 1;
      },
    });
    assert.equal(calls, 1);
    return completion;
  };

  const adFixtures = [
    { vertical: { src: "${adData.rewardAd.materials.adImage.onlineUrl}" } },
    { vertical: { visible: "${state.rewardAdEndMaskVisible} !== true" } },
    { vertical: { type: "RewardVideo" } },
    { vertical: { id: "RewardAdTopClose_1727078097509" } },
  ];
  for (const fixture of adFixtures) {
    const result = run(JSON.stringify(fixture));
    const cleaned = JSON.parse(result.body);
    assert.equal(cleaned.vertical.visible, false);
    assert.deepEqual(cleaned.vertical.children, []);
    assert.equal(cleaned.horizontal.visible, false);
    assert.deepEqual(cleaned.config.children, []);
  }

  for (const safeBody of [
    undefined,
    "",
    "{not-json",
    JSON.stringify({ vertical: { type: "NormalVideoCard", title: "正常内容" } }),
    JSON.stringify({ vertical: { title: "广告创意纪录片" } }),
  ]) {
    assert.deepEqual(run(safeBody), {});
  }
}

console.log("Tencent Video Hikari ad cleaner tests passed (Quantumult X and Surge).");
