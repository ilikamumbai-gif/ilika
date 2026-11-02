import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PRIVATE_BLOGS, MASK_MAKER_CITY_BLOGS, VOICE_MASK_MAKER_LOCATION_BLOGS } from "../src/data/privateBlogs.js";

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
