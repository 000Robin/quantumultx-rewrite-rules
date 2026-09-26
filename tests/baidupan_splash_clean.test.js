#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "baidupan_splash_clean.js");
const script = fs.readFileSync(scriptPath, "utf8");

const run = (body) => {
  let completion;
  vm.runInNewContext(script, {
    $response: { body },
    $done: (result = {}) => { completion = { ...result }; },
    Array,
    JSON,
    Object,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion.body;
};

const adFixture = {
  errno: 0,
  errmsg: "",
  res: {
    imTimeSign: 0,
    reqId: "fixture",
    ad: [{ locCode: "fixture", adInfo: [{ material: [{ id: "creative" }] }] }],
    splash: { cmd: "query", request_count: 10 },
    safeField: "preserve",
  },
};
const cleaned = JSON.parse(run(JSON.stringify(adFixture)));
assert.equal(cleaned.errno, 0);
assert.deepEqual(cleaned.res.ad, []);
assert.equal(Object.prototype.hasOwnProperty.call(cleaned.res, "splash"), false);
assert.equal(cleaned.res.safeField, "preserve");
assert.equal(cleaned.res.reqId, "fixture");

const noAd = '{"errno":0,"errmsg":"","res":{"ad":[]}}';
assert.equal(run(noAd), noAd, "valid no-ad response must pass through byte-for-byte");

for (const unexpected of ["", "{not-json", "null", "[]", '{"errno":0,"res":{"data":[]}}']) {
  assert.equal(run(unexpected), unexpected, "unexpected response must pass through byte-for-byte");
}

console.log("Baidu Netdisk splash cleaner tests passed.");
