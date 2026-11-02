// Some published guides retain their existing /blog/private/ URLs.
// Search indexing is an explicit choice, separate from that URL namespace.
export const isBlogIndexable = (blog) => Boolean(blog) && (
  blog.isPrivate !== true || blog.allowIndexing === true
);

export const getBlogRobots = (blog) =>
  isBlogIndexable(blog) ? "index, follow" : "noindex, nofollow";
