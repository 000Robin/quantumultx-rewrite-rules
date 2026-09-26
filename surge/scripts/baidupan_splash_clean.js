/*
 * Baidu Netdisk splash-ad response for Surge.
 *
 * Scope: GET https://afd.baidu.com/afd/entry?action=query only.
 * The service itself returned this no-ad structure in two HAR captures. Reply
 * before the network request so a later bidding response cannot reach the app.
 */

$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      errno: 0,
      errmsg: "",
      res: { ad: [] },
    }),
  },
});
