import fs from "node:fs";
import { BLOG_REDIRECTS } from "../src/data/blogConsolidation.js";
import test from "node:test";
import assert from "node:assert/strict";
import { buildBlogUrl } from "../src/utils/blogRoutes.js";
import {
  HAIR_TOOL_COMPARISON_BLOGS,
  PRIVATE_BLOGS,
  STATIC_BLOGS,
  VOICE_MASK_MAKER_LOCATION_BLOGS,
} from "../src/data/privateBlogs.js";

test("buildBlogUrl uses the private blog route for private entries", () => {
  const blog = { id: "blog-1", slug: "My Private Blog", isPrivate: true };
  assert.equal(buildBlogUrl(blog), "/blog/private/my-private-blog");
});

test("buildBlogUrl keeps blog paths unique when slugs collide", () => {
  const usedPaths = new Set();
  const first = buildBlogUrl({ id: "blog-1", slug: "Same Blog" }, { usedPaths });
  const second = buildBlogUrl({ id: "blog-2", slug: "Same Blog" }, { usedPaths });

  assert.equal(first, "/blog/same-blog");
  assert.equal(second, "/blog/same-blog-2");
});

test("the selected homemade-mask guide is public and sitemap eligible", () => {
  const slug = "best-ingredients-for-homemade-face-masks-a-complete-guide-to-safe-diy-skincare-2026";
  const blog = PRIVATE_BLOGS.find((entry) => entry.slug === slug);

  assert.ok(blog);
  assert.equal(blog.isPrivate, false);
  assert.equal(buildBlogUrl(blog), `/blog/${slug}`);
  assert.ok(STATIC_BLOGS.some((entry) => entry.slug === slug));
});

test("Voice Mask Maker location blog URLs are unique and consolidated", () => {
  const locationPaths = VOICE_MASK_MAKER_LOCATION_BLOGS.map((blog) => `/blog/${blog.slug}`);
  const staticPaths = STATIC_BLOGS.filter((blog) => !blog.isPrivate).map((blog) => `/blog/${blog.slug}`);

  assert.equal(locationPaths.length, 8);
  assert.equal(new Set(locationPaths).size, locationPaths.length);
  locationPaths.forEach((path) => assert.ok(!staticPaths.includes(path), `${path} must be consolidated`));
  assert.equal(new Set(staticPaths).size, staticPaths.length);
});

test("Hair dryer comparison blogs are public, use varied images, and are sitemap eligible", () => {
  const publicStaticSlugs = new Set(
    STATIC_BLOGS.filter((blog) => !blog.isPrivate).map((blog) => blog.slug)
  );
  const images = new Set(HAIR_TOOL_COMPARISON_BLOGS.map((blog) => blog.image));

  assert.ok(HAIR_TOOL_COMPARISON_BLOGS.length > 1);
  assert.ok(HAIR_TOOL_COMPARISON_BLOGS.every((blog) => !blog.isPrivate));
  assert.ok(HAIR_TOOL_COMPARISON_BLOGS.every((blog) => Boolean(blog.image)));
  assert.ok(images.size > 1);
  HAIR_TOOL_COMPARISON_BLOGS.forEach((blog) => {
    assert.ok(publicStaticSlugs.has(blog.slug), `${blog.slug} is missing from STATIC_BLOGS`);
  });
});

test("every retired city article has a direct 301 to a public guide and canonical internal links", () => {
  const config = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const paths = new Set(STATIC_BLOGS.map(blog => "/blog/" + blog.slug));
  assert.equal(Object.keys(BLOG_REDIRECTS).length, 82);
  for (const [slug, destination] of Object.entries(BLOG_REDIRECTS)) {
    assert.ok(!paths.has("/blog/" + slug));
    assert.ok(paths.has(destination));
    assert.equal(buildBlogUrl({slug}), destination);
    for (const suffix of ["", "/"]) {
      const rule = config.redirects.find(rule => rule.source === "/blog/" + slug + suffix);
      assert.equal(rule?.statusCode, 301);
      assert.equal(rule?.destination, destination);
    }
  }
});
