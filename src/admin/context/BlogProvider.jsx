import React, { createContext, useContext, useState, useEffect } from "react";

const BlogContext = createContext();

export const useBlog = () => useContext(BlogContext);

const STORAGE_KEY = "ilika_blogs";

const BlogProvider = ({ children }) => {
  const [blogs, setBlogs] = useState([]);

  // Load from localStorage (only persistence, not logic)
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    setBlogs(saved);
  }, []);

  // Save whenever blogs change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
  }, [blogs]);

  // CREATE BLOG
  const addBlog = (blog) => {
    const newBlog = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString(),
      ...blog,
    };
    setBlogs((prev) => [newBlog, ...prev]);
  };

  // DELETE BLOG
  const deleteBlog = (id) => {
    setBlogs((prev) => prev.filter((b) => b.id !== id));
  };

  // GET BLOG
  const getBlog = (id) => blogs.find((b) => b.id === id);

  return (
    <BlogContext.Provider value={{ blogs, addBlog, deleteBlog, getBlog }}>
      {children}
    </BlogContext.Provider>
  );
};

export default BlogProvider;