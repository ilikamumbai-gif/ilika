import { buildBlogUrl } from "./blogRoutes.js";
import { getConsolidatedBlogPath } from "../data/blogConsolidation.js";
import { createSlug } from "./slugify.js";

export const getArticleLinkTitle = (title = "") => {
  const text = String(title).trim();
  return /^ilika\b/i.test(text) ? `Ilika${text.slice(5)}` : `Ilika ${text}`;
};

export const getPublicBlogs = (blogs = []) => {
  const byRoute = new Map();
  for (const blog of blogs) {
    if (!blog?.title || blog.isPrivate) continue;
    const slug = createSlug(blog.slug || blog.title);
    if (getConsolidatedBlogPath(slug)) continue;
    const route = buildBlogUrl(blog);
    if (!byRoute.has(route)) byRoute.set(route, blog);
  }
  return Array.from(byRoute, ([route, blog]) => ({ route, blog }));
};
