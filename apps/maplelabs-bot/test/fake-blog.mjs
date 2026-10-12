// A fake blog for testing the bot without sending any traffic to the real blog.
//   node test/fake-blog.mjs        (prints the URL; run the bot with SITE=<that url>)
import http from "node:http";
import { fileURLToPath } from "node:url";

export const KEY = "test-read-key";

export const hits = { analytics: 0, rules: 0, posts: 0, other: 0 };
export const blog = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const ua = req.headers["user-agent"] || "";
  const send = (code, type, body) => { res.writeHead(code, { "content-type": type }); res.end(body); };
  if (url.pathname === "/robots.txt") { hits.other++; return send(200, "text/plain", "User-agent: *\nAllow: /\n"); }
  if (url.pathname === "/llms.txt") { hits.other++; return send(200, "text/plain", "# Test blog\nAI access: 0.01 USDC per post\n"); }
  if (url.pathname === "/sitemap.xml") {
    hits.other++;
    const base = `http://localhost:${blog.address().port}`;
    return send(200, "application/xml", `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/2026/06/22/post-one.html</loc></url><url><loc>${base}/2026/06/23/post-two.html</loc></url></urlset>`);
  }
  if (url.pathname === "/api/analytics") {
    hits.analytics++;
    if (url.searchParams.get("auth") !== KEY) return send(401, "application/json", '{"ok":false,"error":"Password required"}');
    return send(200, "application/json", JSON.stringify({ ok: true, places: [{ country: "United States", city: "Austin", lat: 30.4, lon: -97.7, count: 5 }], recent: [{ ts: new Date().toISOString(), path: "/2026/06/22/post-one.html", agent: "MapleLabsBot", ua: "MapleLabsBot-Search", status: 402 }] }));
  }
  if (url.pathname === "/api/bot-rules") {
    hits.rules++;
    return send(200, "application/json", JSON.stringify({ ok: true, rules: [{ id: "maplelabs", name: "MapleLabsBot", allowed: false, charge: true }] }));
  }
  if (url.pathname.endsWith(".html")) {
    hits.posts++;
    if (/MapleLabsBot/i.test(ua)) return send(402, "application/json", JSON.stringify({ ok: false, paymentRequired: true, status: 402, pay: { amount: "0.01 USDC", network: "Base" } }));
    return send(200, "text/html", "<h1>post</h1>");
  }
  send(404, "text/plain", "not found");
});


export function startFakeBlog(port = 0) {
  return new Promise((resolve) => blog.listen(port, () => resolve(`http://localhost:${blog.address().port}`)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = await startFakeBlog(Number(process.env.PORT) || 0);
  console.log(`Fake blog on ${url}. Read key: ${KEY}`);
}
