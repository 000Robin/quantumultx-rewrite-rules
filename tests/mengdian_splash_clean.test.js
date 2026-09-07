#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "mengdian_splash_clean.js");
const script = fs.readFileSync(scriptPath, "utf8");

const run = (body) => {
  let completion;
  vm.runInNewContext(script, {
    $response: { body },
    $done: (result = {}) => {
      completion = { ...result };
    },
    JSON,
    Set,
    String,
    RegExp,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion.body;
};

const fixture = {
  code: 0,
  trace: "preserve-this-field",
  data: [
    {
      zybb: "3.1.5",
      wjbh: "app-package",
      wjmc: "mdej_3.1.5_sign.apk",
      wjlx: "apk",
      fileFullPath: "/XXFBPT/fixture/application.apk",
    },
    {
      wjbh: "splash-image",
      wjmc: "startup.jpg",
      wjlx: "jpg",
      fileFullPath: "/XXFBPT/fixture/startup.jpg",
    },
  ],
};

const cleaned = JSON.parse(run(JSON.stringify(fixture)));
assert.equal(cleaned.code, 0);
assert.equal(cleaned.trace, "preserve-this-field");
assert.equal(cleaned.data.length, 1);
assert.equal(cleaned.data[0].wjbh, "app-package");
assert.equal(cleaned.data[0].fileFullPath.endsWith(".apk"), true);

const mismatchedType = JSON.stringify({
  code: 0,
  data: [{ wjlx: "jpg", fileFullPath: "/XXFBPT/fixture/application.apk" }],
});
assert.equal(run(mismatchedType), mismatchedType, "type/path mismatch must pass through");

for (const malformed of ["", "{not-json", "null", "[]", JSON.stringify({ code: 0 })]) {
  assert.equal(run(malformed), malformed, "unexpected response must pass through byte-for-byte");
}

console.log("Mengdian splash cleaner tests passed.");
