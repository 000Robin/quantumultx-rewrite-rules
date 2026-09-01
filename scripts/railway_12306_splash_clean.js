/*
 * China Railway 12306 splash response for Quantumult X.
 *
 * Scope: POST https://ad.12306.cn/ad/ser/getAdList only.
 * A transport rejection makes the app wait on its native splash timeout.
 * This script returns a valid ad-list response with a zero-second delay.
 */

const requestBody =
  typeof $request !== "undefined" && typeof $request.body === "string"
    ? $request.body
    : "";

const readPlacement = (body) => {
  try {
    const parsed = JSON.parse(body || "{}");
    return typeof parsed.placementNo === "string" ? parsed.placementNo : "";
  } catch (_) {
    return "";
  }
};

const buildPayload = (placementNo) => {
  if (placementNo === "0007") {
    return {
      code: "00",
      materialsList: [
        {
          billMaterialsId: "0",
          filePath: "h",
          creativeType: 1,
        },
      ],
      advertParam: {
        skipTime: 0,
      },
    };
  }

  return {
    code: "00",
    materialsList: [],
  };
};

$done({
  status: "HTTP/1.1 200 OK",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(buildPayload(readPlacement(requestBody))),
});
