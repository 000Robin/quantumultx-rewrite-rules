/*
 * Baidu Netdisk splash-ad response for Quantumult X.
 *
 * Scope: GET https://afd.baidu.com/afd/entry?action=query only.
 * The service itself returned this no-ad structure in two HAR captures. Reply
 * before the network request so a later bidding response cannot reach the app.
 */

$done({
  status: "HTTP/1.1 200 OK",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify({
    errno: 0,
    errmsg: "",
    res: { ad: [] },
  }),
});
