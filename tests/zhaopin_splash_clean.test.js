#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "zhaopin_splash_clean.js"),
  "utf8"
);

const run = (url, body) => {
  let completion;
  vm.runInNewContext(script, {
    $request: { url },
    $response: { body },
    $done: (result = {}) => { completion = result; },
    Array,
    Object,
    Set,
    JSON,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion.body;
};

const adEndpoint = JSON.stringify({ code: 200, message: "ok", data: [{ adId: "fixture" }], total: 1 });
const emptied = JSON.parse(run(
  "https://cgate.zhaopin.com/operation/ad/getAdRecommend?fixture=1",
  adEndpoint
));
assert.equal(emptied.code, 200);
assert.equal(emptied.message, "ok");
assert.deepEqual(emptied.data, []);
assert.equal(emptied.total, 0);

const config = {
  code: 200,
  data: {
    loginEnabled: true,
    homeTabs: ["职位", "消息"],
    address: "Beijing",
    splashAd: { image: "https://ad.example/splash.jpg" },
    showLaunchAd: 1,
    nested: { bannerAds: [{ id: 1 }], account: { id: "safe" } },
  },
};
const cleanedConfig = JSON.parse(run(
  "https://cgate.zhaopin.com/bdp/entrance/appGrayHomeConfig",
  JSON.stringify(config)
));
assert.equal(cleanedConfig.data.loginEnabled, true);
assert.deepEqual(cleanedConfig.data.homeTabs, config.data.homeTabs);
assert.equal(cleanedConfig.data.address, "Beijing");
assert.deepEqual(cleanedConfig.data.splashAd, {});
assert.equal(cleanedConfig.data.showLaunchAd, 0);
assert.deepEqual(cleanedConfig.data.nested.bannerAds, []);
assert.deepEqual(cleanedConfig.data.nested.account, { id: "safe" });

const malformed = "{not-json";
assert.equal(run("https://capi.zhaopin.com/capi/commercialize/getConfig", malformed), malformed);

console.log("Zhaopin splash cleaner tests passed.");
