const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

for (const variant of ["scripts", "surge/scripts"]) {
  const source = fs.readFileSync(path.join(__dirname, "..", variant, "tencent_video_creative_block.js"), "utf8");
  const run = (body, overrides = {}) => {
    let result;
    let calls = 0;
    vm.runInNewContext(source, {
      $request: { method: "POST", url: "https://svv.video.qq.com/getvinfo", body, ...overrides },
      $done: (value) => { result = JSON.parse(JSON.stringify(value)); calls += 1; },
    });
    assert.equal(calls, 1);
    return result;
  };
  for (const body of ["vid=z46344hz3sb", "vid=z46344hz3sb&", "dtype=3&vid=z46344hz3sb&atime=0", "v%69d=%7A46344hz3sb"]) {
    const result = run(body);
    assert.equal(variant === "scripts" ? result.status : result.response.status,
      variant === "scripts" ? "HTTP/1.1 204 No Content" : 204);
  }
  for (const body of [undefined, "", "vid=normal-video", "vid=z46344hz3sb-other", "vid=z46344hz3sb,normal", "vid=z46344hz3sb&vid=normal", "vid=z46344hz3sb&vid=z46344hz3sb", "vid=%ZZ", "vid=z46344hz3sb&other=%ZZ", '{"vid":"z46344hz3sb"}', "vid=z46344hz3sb&invalid"]) {
    assert.deepEqual(run(body), {});
  }
  for (const url of ["https://vv.video.qq.com/getvinfo", "https://vv6.video.qq.com/batchvinfo", "https://svv.video.qq.com/getvinfo/extra", "https://svv.video.qq.com.evil.test/getvinfo", "http://svv.video.qq.com/getvinfo"]) {
    assert.deepEqual(run("vid=z46344hz3sb", { url }), {});
  }
  assert.deepEqual(run("vid=z46344hz3sb", { method: "GET" }), {});
}
console.log("Tencent Video verified creative tests passed (Quantumult X and Surge).");
