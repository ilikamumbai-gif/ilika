import test from "node:test";
import assert from "node:assert/strict";
import { WATCH_VIDEOS, getWatchPath, getVideoSchema } from "../src/data/watchVideos.js";
import { renderWatchContent, renderVideoLibrary } from "../src/utils/videoPages.js";
import { buildVideoHtml, buildVideoSitemap } from "./prerender-video-pages.mjs";

const template = '<html><head><title>Ilika</title><link rel="canonical" href="https://ilika.in/" /></head><body><div id="root"></div></body></html>';

test("each affected video has one visible, playable watch-page player and matching schema", () => {
  assert.equal(WATCH_VIDEOS.length, 5);
  assert.equal(new Set(WATCH_VIDEOS.map(getWatchPath)).size, 5);
  for (const video of WATCH_VIDEOS) {
    const html = buildVideoHtml(template, video);
    assert.equal((html.match(/<(?:iframe|video)\s/g) || []).length, 1);
    assert.ok(html.indexOf("<h1") < html.search(/<(?:iframe|video)\s/));
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.deepEqual(schema, getVideoSchema(video));
    assert.match(schema.uploadDate, /^\d{4}-\d{2}-\d{2}T/);
    assert.ok(schema.embedUrl || schema.contentUrl);
    assert.ok(!/autoplay|loading="lazy"/.test(renderWatchContent(video)));
    assert.match(html, /<footer/);
  }
});

test("video library and video sitemap discover watch pages instead of product pages", () => {
  const library = renderVideoLibrary();
  const xml = buildVideoSitemap();
  for (const video of WATCH_VIDEOS) {
    assert.ok(library.includes(`href="${getWatchPath(video)}"`));
    assert.ok(xml.includes(`<loc>https://ilika.in${getWatchPath(video)}</loc>`));
  }
  assert.equal((xml.match(/<video:video>/g) || []).length, 5);
  assert.ok(xml.includes("<video:content_loc>https://ilika.in/HonestReview/"));
  assert.ok(xml.includes("<video:player_loc>https://www.youtube.com/embed/"));
  assert.ok(!/<(?:iframe|video)\s/.test(library));
});

test("video metadata cannot inject markup into prerendered HTML or JSON-LD", () => {
  const video = { ...WATCH_VIDEOS[0], title: '</script><img src=x onerror="alert(1)">', description: "A & B" };
  const html = buildVideoHtml(template, video);
  assert.ok(!html.includes('<img src=x onerror="alert(1)">'));
  assert.ok(html.includes("A &amp; B"));
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.name, video.title);
});
