/* Return a valid empty JSON object without contacting the upstream ad endpoint. */

$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: "{}",
  },
});
