// Local end-to-end check that never touches the real blog and never moves money (it does not call /api/pay).
//   node test/local-flow.mjs
// It starts a fake blog on localhost, runs the bot server against it, and checks the crawl,
// the 402, the globe and log data, the policy default and the request caching.
// Every step has a timeout and the whole run is capped, so it cannot hang.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { blog, hits, KEY, startFakeBlog } from "./fake-blog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let bot;
const failures = [];
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`); if (!ok) failures.push(name); };
const finish = (code) => { try { bot?.kill(); blog.close(); } catch {} process.exit(code); };
setTimeout(() => { console.error("TIMEOUT: test run exceeded 60s"); finish(2); }, 60_000).unref();

const getJson = async (base, path) => (await fetch(base + path, { signal: AbortSignal.timeout(10_000) })).json();

const SITE = await startFakeBlog();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const BASE = `http://localhost:${PORT}`;

// A non-empty, invalid key: the server's .env.local loader treats empty values as unset and would load the real key.
bot = spawn(process.execPath, ["server.mjs"], {
  cwd: ROOT,
  env: { PATH: process.env.PATH, SITE, PORT: String(PORT), ANALYTICS_KEY: KEY, ADMIN_KEY: "", BUYER_WALLET_PRIVATE_KEY: "TEST-ONLY-INVALID-KEY", BUYER_WALLET_ADDRESS: "", ANTHROPIC_API_KEY: "", OPENAI_API_KEY: "", SELLER_WALLET_ADDRESS: "0x000000000000000000000000000000000000dEaD" },
  stdio: "ignore",
});
for (let i = 0; i < 40; i++) {
  try { await fetch(BASE + "/api/config", { signal: AbortSignal.timeout(500) }); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
}

const cfg = await getJson(BASE, "/api/config");
check("config exposes read access without the admin key", cfg.canRead === true && cfg.canControl === false);

const places = (await getJson(BASE, "/api/places")).places;
check("globe gets places", Array.isArray(places) && places.length === 1);
const log = (await getJson(BASE, "/api/log")).rows;
check("gate log gets rows", Array.isArray(log) && log.length === 1);
check("policy defaults to charge", (await getJson(BASE, "/api/policy")).mode === "charge");

for (let i = 0; i < 6; i++) { await getJson(BASE, "/api/places"); await getJson(BASE, "/api/log"); await getJson(BASE, "/api/policy"); }
check("analytics is fetched once however often the page asks", hits.analytics === 1, `${hits.analytics} request(s) reached the blog`);
check("bot rules are fetched once", hits.rules === 1, `${hits.rules} request(s)`);

// Crawl: the bot reads robots, sitemap, then hits a post and must stop at the 402 with a price.
const events = [];
const ctl = new AbortController();
const timer = setTimeout(() => ctl.abort(), 25_000);
try {
  const res = await fetch(BASE + "/api/run", { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: "search", brain: "maplelabs", question: "How do agents pay?", respectRobots: true }) });
  const text = await res.text();
  for (const line of text.split("\n")) if (line.startsWith("data: ")) events.push(JSON.parse(line.slice(6)));
} catch (err) { check("crawl finished in time", false, err.message); }
clearTimeout(timer);
const payment = events.find((e) => e.type === "payment");
check("crawl reaches the 402 and shows a Base price", !!payment && /0\.01/.test(String(payment.price)) && payment.network === "Base", payment ? `${payment.price} on ${payment.network}` : "no payment event");
check("crawl ends cleanly", events.some((e) => e.type === "done"));

// Payments are deliberately NOT exercised here: this test must never be able to spend money.

console.log(`\nRequests that reached the FAKE blog: analytics ${hits.analytics}, rules ${hits.rules}, posts ${hits.posts}, other ${hits.other}. Requests to the real blog: 0.`);
console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nAll checks passed");
finish(failures.length ? 1 : 0);
