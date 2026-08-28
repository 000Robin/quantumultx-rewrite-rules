/*
 * YouTube ad response cleaner for Quantumult X.
 *
 * - JSON: removes only named ad containers and renderer nodes.
 * - Protobuf player response: removes top-level ad placement fields 7 and 68.
 * - Every other protobuf field is copied byte-for-byte.
 * - Unsupported or malformed responses pass through unchanged.
 */

const requestUrl = ($request && $request.url) || "";
const endpointMatch = requestUrl.match(
  /\/youtubei\/v1\/(browse|next|player|search|reel\/reel_watch_sequence)(?:\?|$)/
);
const endpoint = endpointMatch ? endpointMatch[1] : "";

const adContainerKeys = new Set(["adPlacements", "playerAds", "adSlots"]);
const adRendererKeys = new Set([
  "adSlotRenderer",
  "compactPromotedVideoRenderer",
  "displayAdRenderer",
  "inFeedAdLayoutRenderer",
  "mastheadAdRenderer",
  "promotedSparklesTextSearchRenderer",
  "promotedSparklesWebRenderer",
  "promotedVideoRenderer",
]);
const dropNode = {};

let jsonChanged = false;

const cleanJson = (value) => {
  if (Array.isArray(value)) {
    const output = [];
    for (const item of value) {
      const cleaned = cleanJson(item);
      if (cleaned !== dropNode) output.push(cleaned);
      else jsonChanged = true;
    }
    return output;
  }

  if (!value || typeof value !== "object") return value;

  if (Object.keys(value).some((key) => adRendererKeys.has(key))) {
    return dropNode;
  }

  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (adContainerKeys.has(key)) {
      jsonChanged = true;
      continue;
    }

    const cleaned = cleanJson(child);
    if (cleaned === dropNode) {
      jsonChanged = true;
    } else {
      output[key] = cleaned;
    }
  }
  return output;
};

const readVarint = (bytes, offset) => {
  let value = 0;
  let multiplier = 1;
  let cursor = offset;

  for (let index = 0; index < 10; index += 1) {
    if (cursor >= bytes.length) throw new Error("truncated varint");
    const byte = bytes[cursor];
    cursor += 1;
    value += (byte & 0x7f) * multiplier;
    if (!Number.isSafeInteger(value)) throw new Error("oversized varint");
    if ((byte & 0x80) === 0) return { value, next: cursor };
    multiplier *= 128;
  }

  throw new Error("invalid varint");
};

const skipFieldValue = (bytes, offset, wireType, fieldNumber) => {
  if (wireType === 0) return readVarint(bytes, offset).next;
  if (wireType === 1) {
    const end = offset + 8;
    if (end > bytes.length) throw new Error("truncated fixed64");
    return end;
  }
  if (wireType === 2) {
    const lengthInfo = readVarint(bytes, offset);
    const end = lengthInfo.next + lengthInfo.value;
    if (!Number.isSafeInteger(end) || end > bytes.length) {
      throw new Error("truncated length-delimited field");
    }
    return end;
  }
  if (wireType === 3) {
    let cursor = offset;
    while (cursor < bytes.length) {
      const tagInfo = readVarint(bytes, cursor);
      const nestedField = Math.floor(tagInfo.value / 8);
      const nestedWire = tagInfo.value % 8;
      if (nestedField === 0) throw new Error("invalid group field");
      if (nestedWire === 4) {
        if (nestedField !== fieldNumber) throw new Error("mismatched group end");
        return tagInfo.next;
      }
      cursor = skipFieldValue(bytes, tagInfo.next, nestedWire, nestedField);
    }
    throw new Error("unterminated group");
  }
  if (wireType === 5) {
    const end = offset + 4;
    if (end > bytes.length) throw new Error("truncated fixed32");
    return end;
  }
  throw new Error("unsupported wire type");
};

const stripPlayerAdFields = (bytes) => {
  const keptChunks = [];
  let keptLength = 0;
  let cursor = 0;
  let changed = false;

  while (cursor < bytes.length) {
    const start = cursor;
    const tagInfo = readVarint(bytes, cursor);
    const fieldNumber = Math.floor(tagInfo.value / 8);
    const wireType = tagInfo.value % 8;
    if (fieldNumber === 0 || wireType === 4) throw new Error("invalid top-level field");

    const end = skipFieldValue(bytes, tagInfo.next, wireType, fieldNumber);
    const isAdField = wireType === 2 && (fieldNumber === 7 || fieldNumber === 68);
    if (isAdField) {
      changed = true;
    } else {
      const chunk = bytes.subarray(start, end);
      keptChunks.push(chunk);
      keptLength += chunk.length;
    }
    cursor = end;
  }

  if (!changed) return null;

  const output = new Uint8Array(keptLength);
  let outputOffset = 0;
  for (const chunk of keptChunks) {
    output.set(chunk, outputOffset);
    outputOffset += chunk.length;
  }
  return output;
};

const textBody = typeof $response.body === "string" ? $response.body : "";

if (endpoint && textBody.trim().startsWith("{")) {
  try {
    const parsed = JSON.parse(textBody);
    const cleaned = cleanJson(parsed);
    if (jsonChanged && cleaned !== dropNode) {
      $done({ body: JSON.stringify(cleaned) });
    } else {
      $done({});
    }
  } catch (_) {
    $done({});
  }
} else if (endpoint === "player" && $response.bodyBytes) {
  try {
    const input = new Uint8Array($response.bodyBytes);
    const output = stripPlayerAdFields(input);
    if (output) {
      $done({ bodyBytes: output.buffer });
    } else {
      $done({});
    }
  } catch (_) {
    $done({});
  }
} else {
  $done({});
}
