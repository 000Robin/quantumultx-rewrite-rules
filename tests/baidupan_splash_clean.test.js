#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "baidupan_splash_clean.js");
const script = fs.readFileSync(scriptPath, "utf8");

const run = () => {
  let completion;
  vm.runInNewContext(script, {
    $done: (result = {}) => { completion = { ...result }; },
    JSON,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion;
};

const result = run();
assert.equal(result.status, "HTTP/1.1 200 OK");
assert.equal(result.headers["Content-Type"], "application/json; charset=utf-8");
assert.equal(result.headers["Cache-Control"], "no-store");
assert.deepEqual(JSON.parse(result.body), {
  errno: 0,
  errmsg: "",
  res: { ad: [] },
});

console.log("Baidu Netdisk splash cleaner tests passed.");
