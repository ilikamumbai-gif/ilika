import test from "node:test";
import assert from "node:assert/strict";
import { getPublicBlogs } from "../src/utils/publicBlogs.js";

test("the article index combines repository and API articles with canonical links", () => {
  const articles = getPublicBlogs([
    { title: "Repository article", slug: "shared-article" },
    { title: "API duplicate", slug: "shared-article" },
    { title: "New API Article" },
    { title: "Private article", slug: "private-article", isPrivate: true },
    { title: "Old city offer", slug: "hair-dryer-price-drop-mumbai-400013" },
    { title: "Hair Dryer Price Drop Mumbai 400013" },
    { slug: "empty-article" },
  ]);
  assert.deepEqual(articles.map(({ route }) => route), ["/blog/shared-article", "/blog/new-api-article"]);
  assert.equal(articles[0].blog.title, "Repository article");
});
