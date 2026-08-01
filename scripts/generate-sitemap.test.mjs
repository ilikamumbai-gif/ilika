import test from "node:test";
import assert from "node:assert/strict";
import { buildBlogUrl } from "../src/utils/blogRoutes.js";

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
