const BLOG_KEY = "ilika_admin_blogs";

export const getBlogs = () => {
  return JSON.parse(localStorage.getItem(BLOG_KEY)) || [];
};

export const saveBlogs = (blogs) => {
  localStorage.setItem(BLOG_KEY, JSON.stringify(blogs));
};

export const createBlog = (blog) => {
  const blogs = getBlogs();
  blogs.unshift(blog);
  saveBlogs(blogs);
};

export const deleteBlog = (id) => {
  const blogs = getBlogs().filter((b) => b.id !== id);
  saveBlogs(blogs);
};

export const getBlogById = (id) => {
  return getBlogs().find((b) => b.id === id);
};