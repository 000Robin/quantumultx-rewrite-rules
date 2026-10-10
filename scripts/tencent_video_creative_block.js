/*
 * Block only a visually verified advertising creative from the 2026-10-10 HAR.
 * svv.video.qq.com also resolves ordinary videos: never reject the whole API.
 * The captured iPhone creative is not the Watch creative in the screenshot.
 */
let blocked = false;
try {
  if (
    $request.method === "POST" &&
    /^https:\/\/svv\.video\.qq\.com\/getvinfo(?:\?.*)?$/.test($request.url || "") &&
    typeof $request.body === "string"
  ) {
    const fields = $request.body.split("&").filter(Boolean).map((field) => {
      const split = field.indexOf("=");
      if (split < 0) throw new Error("invalid form");
      const decode = (value) => decodeURIComponent(value.replace(/\+/g, " "));
      return [decode(field.slice(0, split)), decode(field.slice(split + 1))];
    });
    const vids = fields.filter(([name]) => name === "vid");
    blocked = vids.length === 1 && vids[0][1] === "z46344hz3sb";
  }
} catch (_) {
  // Missing, ambiguous, or malformed request bodies pass through unchanged.
}

$done(blocked ? {
  status: "HTTP/1.1 204 No Content",
  headers: { "Cache-Control": "no-store" },
  body: "",
} : {});
