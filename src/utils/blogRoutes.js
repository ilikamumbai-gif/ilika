import { createSlug } from "./slugify.js";

export const buildBlogUrl = (blog, options = {}) => {
  const { usedPaths = new Set() } = options;
  const baseSlug = createSlug(blog?.slug || blog?.title || "") || String(blog?.id || "").trim();
  const isPrivate = Boolean(blog?.isPrivate);
  const basePath = isPrivate ? `/blog/private/${baseSlug}` : `/blog/${baseSlug}`;

  if (!baseSlug || !usedPaths) return basePath;

  let candidate = basePath;
  let suffix = 2;

  while (usedPaths.has(candidate)) {
    candidate = isPrivate
      ? `/blog/private/${baseSlug}-${suffix}`
      : `/blog/${baseSlug}-${suffix}`;
    suffix += 1;
  }

  usedPaths.add(candidate);
  return candidate;
};
