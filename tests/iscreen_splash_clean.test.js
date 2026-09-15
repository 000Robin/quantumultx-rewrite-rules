#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "iscreen_splash_clean.js");
const script = fs.readFileSync(scriptPath, "utf8");

const run = (body) => {
  let completion;
  vm.runInNewContext(script, {
    $response: { body },
    $done: (result = {}) => {
      completion = { ...result };
    },
    JSON,
    Object,
    Set,
    String,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion.body;
};

const legacyFixture = {
  status: 1,
  action_time: 1,
  data: {
    launchAd: 7,
    SplashTimeout: 10,
    BannerAd: 100,
    FeedAd: 7,
    showOurApp: 1,
    userMode: "standard",
  },
};
const cleanedLegacy = JSON.parse(run(JSON.stringify(legacyFixture)));
assert.equal(cleanedLegacy.data.launchAd, 0);
assert.equal(cleanedLegacy.data.SplashTimeout, 0);
assert.equal(cleanedLegacy.data.BannerAd, 100);
assert.equal(cleanedLegacy.data.FeedAd, 7);
assert.equal(cleanedLegacy.data.showOurApp, 1);
assert.equal(cleanedLegacy.data.userMode, "standard");

const groupedFixture = {
  status: 1,
  data: {
    navigate_list: ["preserve"],
    ad_group_configs: {
      content: [
        { code: "oLaunch", name: "launch", rate: 100 },
        { code: "oCommon", name: "launch-global", rate: 100, maxDisplayCount: 5 },
        { code: "sOverseaLaunch", name: "warm-launch", rate: 100 },
        { code: "sLaunch", name: "after-launch", rate: 25 },
        { code: "bRecommend", name: "content-banner", rate: 100 },
        { code: "sCommon", name: "content-interstitial", rate: 100, maxDisplayCount: 6 },
      ],
    },
  },
};
const cleanedGrouped = JSON.parse(run(JSON.stringify(groupedFixture)));
const byCode = Object.fromEntries(
  cleanedGrouped.data.ad_group_configs.content.map((item) => [item.code, item])
);
for (const code of ["oLaunch", "oCommon", "sOverseaLaunch", "sLaunch"]) {
  assert.equal(byCode[code].rate, 0, `${code} must be disabled`);
}
assert.equal(byCode.oCommon.maxDisplayCount, 0);
assert.equal(byCode.bRecommend.rate, 100);
assert.equal(byCode.sCommon.rate, 100);
assert.equal(byCode.sCommon.maxDisplayCount, 6);
assert.deepEqual(cleanedGrouped.data.navigate_list, ["preserve"]);

for (const unexpected of ["", "{not-json", "null", "[]", JSON.stringify({ status: 1 })]) {
  assert.equal(run(unexpected), unexpected, "unexpected response must pass through byte-for-byte");
}

console.log("iScreen splash cleaner tests passed.");
