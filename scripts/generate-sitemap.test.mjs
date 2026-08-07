import test from "node:test";
import assert from "node:assert/strict";
import { buildBlogUrl } from "../src/utils/blogRoutes.js";
import { STATIC_BLOGS, VOICE_MASK_MAKER_LOCATION_BLOGS } from "../src/data/privateBlogs.js";

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

test("Voice Mask Maker location blog URLs are unique and included in static blogs", () => {
  const locationPaths = VOICE_MASK_MAKER_LOCATION_BLOGS.map((blog) => `/blog/${blog.slug}`);
  const staticPaths = STATIC_BLOGS.filter((blog) => !blog.isPrivate).map((blog) => `/blog/${blog.slug}`);

  assert.equal(locationPaths.length, 8);
  assert.equal(new Set(locationPaths).size, locationPaths.length);
  locationPaths.forEach((path) => assert.ok(staticPaths.includes(path), `${path} is missing from STATIC_BLOGS`));
  assert.equal(new Set(staticPaths).size, staticPaths.length);
});
