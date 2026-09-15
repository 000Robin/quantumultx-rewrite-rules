#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "tencent_video_request_clean.js"),
  "utf8"
);

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const run = (bodyBytes) => {
  let completion;
  vm.runInNewContext(script, {
    $request: { bodyBytes },
    $done: (result = {}) => { completion = result; },
    Uint8Array,
    ArrayBuffer,
  });
  assert.notEqual(completion, undefined, "script must call $done");
  return completion;
};

const fixture = encoder.encode(
  "page_home_channel\u0000no_show_update_tip\u0012\u00010\u0000watch_history\u0000vip_identity\u0000playback"
);
const result = run(fixture.buffer);
assert.ok(result.bodyBytes instanceof ArrayBuffer);
assert.equal(result.bodyBytes.byteLength, fixture.byteLength);
const cleaned = decoder.decode(result.bodyBytes);
assert.match(cleaned, /no_show_update_tip\u0012\u00011/);
assert.match(cleaned, /watch_history/);
assert.match(cleaned, /vip_identity/);
assert.match(cleaned, /playback/);

const alreadyEnabled = encoder.encode("no_show_update_tip\u0012\u00011");
assert.equal(Object.keys(run(alreadyEnabled.buffer)).length, 0);
assert.equal(Object.keys(run(undefined)).length, 0);

console.log("Tencent Video request cleaner tests passed.");
