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
  return completion;
};

const adEndpoint = JSON.stringify({ code: 200, message: "ok", data: [{ adId: "fixture" }], total: 1 });
const adCompletion = run(
  "https://cgate.zhaopin.com/operation/ad/getAdRecommend?fixture=1",
  adEndpoint
);
assert.equal(adCompletion.status, "HTTP/1.1 200 OK");
const emptied = JSON.parse(adCompletion.body);
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
).body);
assert.equal(cleanedConfig.data.loginEnabled, true);
assert.deepEqual(cleanedConfig.data.homeTabs, config.data.homeTabs);
assert.equal(cleanedConfig.data.address, "Beijing");
assert.deepEqual(cleanedConfig.data.splashAd, {});
assert.equal(cleanedConfig.data.showLaunchAd, 0);
assert.deepEqual(cleanedConfig.data.nested.bannerAds, []);
assert.deepEqual(cleanedConfig.data.nested.account, { id: "safe" });

const grayConfig = {
  code: 200,
  data: {
    value: [
      { grayCode: "AdThirdPlatform", grayState: 1, grayName: "校园冷启联盟广告" },
      { grayCode: "AdThirdPlatformWakeup", grayState: 1, grayName: "校园热启联盟广告" },
      { grayCode: "HomepageMainModuleRefactoring", grayState: 1, grayName: "功能开关" },
    ],
  },
};
const cleanedGrayConfig = JSON.parse(run(
  "https://cgate.zhaopin.com/bdp/entrance/appGrayHomeConfig",
  JSON.stringify(grayConfig)
).body);
assert.equal(cleanedGrayConfig.data.value[0].grayState, 0);
assert.equal(cleanedGrayConfig.data.value[1].grayState, 0);
assert.equal(cleanedGrayConfig.data.value[2].grayState, 1);

const experimentConfig = {
  code: 200,
  data: { variables: { spring_encourage_popup: "2", safe_experiment: "B" } },
};
const cleanedExperiment = JSON.parse(run(
  "https://fe-api.zhaopin.com/experiment/config/c/app",
  JSON.stringify(experimentConfig)
).body);
assert.equal(cleanedExperiment.data.variables.spring_encourage_popup, "0");
assert.equal(cleanedExperiment.data.variables.safe_experiment, "B");

const malformed = "{not-json";
const malformedCompletion = run("https://capi.zhaopin.com/capi/commercialize/getConfig", malformed);
assert.equal(malformedCompletion.status, "HTTP/1.1 200 OK");
assert.deepEqual(JSON.parse(malformedCompletion.body).data, null);

console.log("Zhaopin splash cleaner tests passed.");
