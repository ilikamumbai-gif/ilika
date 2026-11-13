import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { WATCH_VIDEOS, getWatchPath, getVideoSchema, getVideoThumbnail } from "../src/data/watchVideos.js";

const library = await fs.readFile("dist/videos/index.html", "utf8");
const sitemap = await fs.readFile("dist/video-sitemap.xml", "utf8");
const generalSitemap = await fs.readFile("dist/sitemap.xml", "utf8");
for (const video of WATCH_VIDEOS) {
  const route = getWatchPath(video);
  const html = await fs.readFile(`dist${route}/index.html`, "utf8");
  // The global template also contains a Tag Manager noscript iframe.
  // Only the watch page's main content determines video prominence.
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || "";
  const players = main.match(/<(?:iframe|video)\s/g) || [];
  assert.equal(players.length, 1, `${route}: must contain one primary video`);
  assert.ok(html.includes('data-prerendered="video"'), route);
  assert.ok(html.includes(`<link rel="canonical" href="https://ilika.in${route}"`), route);
  assert.ok(!/\bautoplay\b|\bloading="lazy"/i.test(main), `${route}: watch player must load without interaction`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map((match) => JSON.parse(match[1])).filter((item) => item["@type"] === "VideoObject");
  assert.deepEqual(schemas, [getVideoSchema(video)], `${route}: video schema must match the player`);
  assert.ok(schemas[0].uploadDate && Number.isFinite(Date.parse(schemas[0].uploadDate)), route);
  assert.ok(schemas[0].thumbnailUrl.includes(getVideoThumbnail(video)), route);
  assert.ok(library.includes(`href="${route}"`), `${route}: library discovery link missing`);
  assert.ok(sitemap.includes(`<loc>https://ilika.in${route}</loc>`), `${route}: video sitemap entry missing`);
  assert.ok(generalSitemap.includes(`<loc>https://ilika.in${route}</loc>`), `${route}: general sitemap entry missing`);
}
const libraryMain = library.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || "";
assert.ok(!/<(?:iframe|video)\s/.test(libraryMain), "Library should link to individual watch pages");
console.log(`[videos] Verified ${WATCH_VIDEOS.length} watch pages: primary players, VideoObject metadata, crawlable links and both sitemaps.`);
