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

// Replay request-stage URL scope separately from the response-stage markers.
const root = path.join(__dirname, "..");
const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/tencent-video-hikari-templates.json"), "utf8"));
const qx = fs.readFileSync(path.join(root, "dist/rewrite/tencent-video.snippet"), "utf8");
const qxLine = qx.split("\n").find((line) => line.includes(" url script-echo-response ") && line.includes("tencent_video_hikari_ad_clean.js"));
assert.ok(qxLine, "known ad templates must be echoed before network access");
const exactPattern = qxLine.split(" url ")[0];
const exact = new RegExp(exactPattern);
const base = "https://wallpaper-1258344696.file.myqcloud.com/hikari/template/";
assert.equal(fixtures.ad_templates.length, 41);
assert.equal(fixtures.normal_templates.length, 4);
const newFixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/tencent-video-hikari-20261012.json"), "utf8"));
assert.equal(newFixtures.ad_templates.length, 45);
assert.equal(newFixtures.normal_templates.length, 1);
const allAds = [...new Set([...fixtures.ad_templates, ...newFixtures.ad_templates])];
const allNormal = [...new Set([...fixtures.normal_templates, ...newFixtures.normal_templates])];
assert.equal(allAds.length, 86);
assert.equal(allNormal.length, 5);
for (const filename of allAds) {
  assert.ok(exact.test(base + filename));
  assert.ok(exact.test(base + filename + "?cache=1"));
  assert.equal(exact.test(base + filename.replace(/_\d{14}/, "_20990101000000")), false);
}
for (const filename of allNormal) assert.equal(exact.test(base + filename), false);
for (const url of [
  base + "99999_20990101000000.json",
  base + fixtures.ad_templates[0] + "/extra",
  base.replace("wallpaper-", "wallpaper-test-") + fixtures.ad_templates[0],
  base.replace("/template/", "/module/") + "vendor.zip",
  "https://svv.video.qq.com/getvinfo?vid=normal",
]) assert.equal(exact.test(url), false);
assert.ok(qx.indexOf(qxLine) < qx.indexOf("\\d+_\\d{14}"), "request echo precedes generic response cleaning");
const surge = fs.readFileSync(path.join(root, "surge/modules/managed-rewrite.sgmodule"), "utf8");
assert.ok(surge.includes("type=http-request,pattern=" + exactPattern + ",requires-body=false,"));

for (const variant of ["scripts", "surge/scripts"]) {
  const source = fs.readFileSync(path.join(root, variant, "tencent_video_hikari_ad_clean.js"), "utf8");
  const invoke = (response) => {
    let result, calls = 0;
    const context = { $request: { url: base + fixtures.ad_templates[0], method: "GET" }, $done: (value) => { result = JSON.parse(JSON.stringify(value)); calls++; } };
    if (response) context.$response = response;
    vm.runInNewContext(source, context);
    assert.equal(calls, 1);
    return result;
  };
  const echoed = invoke();
  const response = variant === "scripts" ? echoed : echoed.response;
  assert.equal(response.status, variant === "scripts" ? "HTTP/1.1 200 OK" : 200);
  assert.equal(JSON.parse(response.body).vertical.visible, false);
  assert.ok(response.headers["Cache-Control"].includes("no-store"));
  const originalHeaders = { ETag: "fixture", "Last-Modified": "yesterday", "Content-Length": "123", "Content-Encoding": "gzip", "cache-control": "max-age=86400", "X-Fixture": "keep" };
  const cleaned = invoke({ body: JSON.stringify({ vertical: { type: "RewardVideo" } }), headers: originalHeaders });
  assert.equal(cleaned.headers["X-Fixture"], "keep");
  assert.ok(cleaned.headers["Cache-Control"].includes("no-store"));
  for (const key of ["ETag", "Last-Modified", "Content-Length", "Content-Encoding", "cache-control"]) assert.equal(cleaned.headers[key], undefined);
  assert.equal(originalHeaders.ETag, "fixture");
  assert.deepEqual(invoke({ body: "{bad RewardVideo", headers: originalHeaders }), {});
}
console.log("Hikari request echo scope and cache tests passed (86 ads, 5 protected templates).");

assert.ok(qxLine.endsWith("?v=20261012b"), "new echo script must not reuse the old response-only cache entry");
