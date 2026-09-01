#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "railway_12306_splash_clean.js");
const script = fs.readFileSync(scriptPath, "utf8");

const run = (body) => {
  let completion;
  vm.runInNewContext(script, {
    $request: { body },
    $done: (result = {}) => {
      completion = { ...result };
    },
    JSON,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion;
};

const launch = run(JSON.stringify({ placementNo: "0007", unrelatedField: "fixture-marker" }));
assert.equal(launch.status, "HTTP/1.1 200 OK");
assert.equal(launch.headers["Content-Type"], "application/json; charset=utf-8");
const launchBody = JSON.parse(launch.body);
assert.equal(launchBody.code, "00");
assert.equal(launchBody.advertParam.skipTime, 0);
assert.equal(launchBody.materialsList.length, 1);
assert.equal(launchBody.materialsList[0].filePath, "h");
assert.equal(launch.body.includes("fixture-marker"), false, "request fields must not be echoed");

for (const placementNo of ["0075", "G0054", "unknown"]) {
  const result = JSON.parse(run(JSON.stringify({ placementNo })).body);
  assert.equal(result.code, "00");
  assert.deepEqual(result.materialsList, []);
  assert.equal(Object.hasOwn(result, "advertParam"), false);
}

for (const malformed of ["", "{not-json", "null", "[]"]) {
  const result = JSON.parse(run(malformed).body);
  assert.equal(result.code, "00");
  assert.deepEqual(result.materialsList, []);
}

console.log("12306 splash cleaner tests passed.");
