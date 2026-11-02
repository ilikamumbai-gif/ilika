import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PRIVATE_BLOGS, MASK_MAKER_CITY_BLOGS, VOICE_MASK_MAKER_LOCATION_BLOGS } from "../src/data/privateBlogs.js";
import { FRESH_MASK_BLOG } from "../src/data/freshMaskBlog.js";
import { FRUIT_MASK_BLOG } from "../src/data/fruitMaskBlog.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const run = (script, cwd, env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [path.join(root, script)], { cwd, env, windowsHide: true });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.on("error", reject);
  child.on("close", (code) => code === 0 ? resolve() : reject(new Error(output)));
});

test("sitemap and generated HTML publish 14 guides and 21 distinct location articles", async () => {
  const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(request.url === "/api/blogs"
      ? [{ title: "Unpublished private article", slug: "unpublished-private", isPrivate: true }]
      : []));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  await fs.mkdir(path.join(root, ".tmp"), { recursive: true });
  const cwd = await fs.mkdtemp(path.join(root, ".tmp", "blog-indexing-"));
  try {
    await fs.mkdir(path.join(cwd, "public"));
    await fs.mkdir(path.join(cwd, "dist"));
    await fs.copyFile(path.join(root, "index.html"), path.join(cwd, "dist", "index.html"));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const env = {
      ...process.env,
      SITEMAP_PRODUCTS_URL: `${origin}/api/products`,
      SITEMAP_CATEGORIES_URL: `${origin}/api/categories`,
      SITEMAP_BLOGS_URL: `${origin}/api/blogs`,
      SITE_URL: "https://ilika.in",
    };
    await run("scripts/generate-sitemap.mjs", cwd, env);
    await run("scripts/prerender-catalog-pages.mjs", cwd, env);
    const sitemap = await fs.readFile(path.join(cwd, "public", "sitemap.xml"), "utf8");
    const directory = await fs.readFile(path.join(cwd, "dist", "articles", "index.html"), "utf8");
    const storyPath = `/blog/${FRESH_MASK_BLOG.slug}`;
    assert(sitemap.includes(`<loc>https://ilika.in${storyPath}</loc>`));
    assert(!sitemap.includes("<loc>https://ilika.in/voice-mask-maker-at-home</loc>"));
    assert(directory.includes(`href="${storyPath}"`));
    const journal = await fs.readFile(path.join(cwd, "dist", "blog", "index.html"), "utf8");
    assert(journal.includes(`href="${storyPath}"`), "The new story must be visible on /blog without JavaScript");
    const story = await fs.readFile(path.join(cwd, "dist", storyPath, "index.html"), "utf8");
    assert(story.includes(`<link rel="canonical" href="https://ilika.in${storyPath}"`));
    assert.deepEqual([...story.matchAll(/src="\/MaskMakerStory\/(\d+)-[^" ]+"/g)].map((match) => Number(match[1])), [7, 6, 5, 4, 3, 2, 1]);
    const fruitPath = `/blog/${FRUIT_MASK_BLOG.slug}`;
    assert(sitemap.includes(`<loc>https://ilika.in${fruitPath}</loc>`));
    assert(directory.includes(`href="${fruitPath}"`) && journal.includes(`href="${fruitPath}"`));
    const fruitStory = await fs.readFile(path.join(cwd, "dist", fruitPath, "index.html"), "utf8");
    assert(fruitStory.includes(`<link rel="canonical" href="https://ilika.in${fruitPath}"`));
    assert(!fruitStory.includes("{{maskMaker."));
    const modelHeading = fruitStory.indexOf("<h2>Available in Two Variants</h2>");
    assert(modelHeading > fruitStory.indexOf("<h2>A Few Simple Tips</h2>"));
    const models = fruitStory.slice(modelHeading, fruitStory.indexOf("<h2>Ready to Try Something New?</h2>"));
    assert(models.includes("href='/product/voice-face-mask-maker'"));
    assert(models.includes("href='/product/non-voice-face-mask-maker'"));
    assert(models.includes("32 collagen peptide tablets included + 8 extra tablets FREE"));
    assert(models.includes("25 g Hydra Gel FREE"));
    assert(fruitStory.includes("<h2>Your Questions, Answered</h2>"));
    const guides = PRIVATE_BLOGS.filter((blog) => blog.isPrivate);
    assert.equal(guides.length, 14);
    for (const guide of guides) {
      const route = `/blog/private/${guide.slug}`;
      const url = `https://ilika.in${route}`;
      assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1, `One sitemap entry: ${route}`);
      assert(directory.includes(`href="${route}"`), `Discoverable directory link: ${route}`);
      const html = await fs.readFile(path.join(cwd, "dist", route, "index.html"), "utf8");
      assert.match(html, /<meta name="robots" content="index, follow"/);
      assert(!/<meta[^>]+content="[^"]*noindex/i.test(html), `No conflicting noindex: ${route}`);
      assert(html.includes(`<link rel="canonical" href="${url}"`), `Stable canonical: ${route}`);
      const legacy = await fs.readFile(path.join(cwd, "dist", "blog", guide.slug, "index.html"), "utf8");
      assert.match(legacy, /<meta name="robots" content="noindex, nofollow"/);
      assert(legacy.includes(`<link rel="canonical" href="${url}"`));
    }
    const locations = [...MASK_MAKER_CITY_BLOGS, ...VOICE_MASK_MAKER_LOCATION_BLOGS];
    assert.equal(locations.length, 21);
    assert.equal(new Set(locations.map((blog) => blog.content)).size, 21, "Location articles retain different original content");
    for (const blog of locations) {
      const route = `/blog/${blog.slug}`;
      const url = `https://ilika.in${route}`;
      assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1, `Location sitemap entry: ${route}`);
      assert(directory.includes(`href="${route}"`), `Location directory link: ${route}`);
      const html = await fs.readFile(path.join(cwd, "dist", route, "index.html"), "utf8");
      assert.match(html, /<meta name="robots" content="index, follow"/);
      assert(html.includes(`<link rel="canonical" href="${url}"`), `Location self canonical: ${route}`);
      const firstParagraph = blog.content.match(/<p>([\s\S]*?)<\/p>/)?.[1];
      const originalText = firstParagraph.split("{{maskMaker.")[0];
      assert(html.includes(originalText), `Preserved location content: ${route}`);
      assert(!html.includes("{{maskMaker."), `Resolved live prices: ${route}`);
      assert(html.includes("8 collagen peptide tablets FREE"), `Location offer: ${route}`);
    }
    assert(!sitemap.includes("unpublished-private"));
    assert(!directory.includes("unpublished-private"));
    const hidden = await fs.readFile(path.join(cwd, "dist", "blog", "private", "unpublished-private", "index.html"), "utf8");
    assert.match(hidden, /<meta name="robots" content="noindex, nofollow"/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
