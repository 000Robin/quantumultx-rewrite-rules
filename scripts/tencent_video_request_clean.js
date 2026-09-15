/*
 * Tencent Video home-page request preference cleaner.
 * Scope: binary requests to https://i.video.qq.com/ only.
 * It enables the existing no_show_update_tip preference without changing length.
 */

const rawBodyBytes = $request.bodyBytes;

if (!(rawBodyBytes instanceof ArrayBuffer)) {
  $done({});
} else {
  const output = new Uint8Array(rawBodyBytes.slice(0));
  const marker = "no_show_update_tip";
  const markerBytes = new Uint8Array(marker.length);
  for (let index = 0; index < marker.length; index += 1) {
    markerBytes[index] = marker.charCodeAt(index);
  }

  let changed = false;
  for (let offset = 0; offset <= output.length - markerBytes.length - 3; offset += 1) {
    let matched = true;
    for (let index = 0; index < markerBytes.length; index += 1) {
      if (output[offset + index] !== markerBytes[index]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;

    const valueOffset = offset + markerBytes.length;
    // Protobuf string field: tag 0x12, length 1, ASCII "0".
    if (
      output[valueOffset] === 0x12 &&
      output[valueOffset + 1] === 0x01 &&
      output[valueOffset + 2] === 0x30
    ) {
      output[valueOffset + 2] = 0x31;
      changed = true;
    }
  }

  $done(changed ? { bodyBytes: output.buffer } : {});
}
