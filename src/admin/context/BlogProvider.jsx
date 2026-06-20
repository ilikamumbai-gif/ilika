import React from "react";
import { createContext, useContext, useState, useEffect } from "react";

const BlogContext = createContext();

export const useBlog = () => useContext(BlogContext);

const API = import.meta.env.VITE_API_URL;

const BlogProvider = ({ children }) => {

  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  /* ================= FETCH BLOGS ================= */

  const fetchBlogs = async () => {

    try {
      setLoadingBlogs(true);

      const res = await fetch(`${API}/api/blogs`);

      const data = await res.json();

      setBlogs(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Failed to fetch blogs:", err);

    } finally {

      setLoadingBlogs(false);

    }

  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  /* ================= ADD BLOG ================= */

  const addBlog = async (blog) => {

    try {

      const res = await fetch(`${API}/api/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blog),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to add blog");
      }

      const newBlog = await res.json();

      // update state without refetch
      setBlogs(prev => [newBlog, ...prev]);
      await fetchBlogs();
      return newBlog;

    } catch (err) {

      console.error("Add blog failed:", err);
      throw err;

    }

  };

  /* ================= UPDATE BLOG ================= */

  const updateBlog = async (id, blog) => {

    try {

      const res = await fetch(`${API}/api/blogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blog),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to update blog");
      }

      const updatedBlog = await res.json();

      setBlogs((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updatedBlog,
                id: updatedBlog?.id || id,
              }
            : item
        )
      );
      await fetchBlogs();
      return updatedBlog;

    } catch (err) {

      console.error("Update blog failed:", err);
      throw err;

    }

  };

  /* ================= DELETE BLOG ================= */

  const deleteBlog = async (id) => {

    try {

      await fetch(`${API}/api/blogs/${id}`, {
        method: "DELETE",
      });

      // remove from state instantly
      setBlogs(prev => prev.filter(blog => blog.id !== id));

    } catch (err) {

      console.error("Delete blog failed:", err);

    }

  };

  return (
    <BlogContext.Provider
      value={{
        blogs,
        loadingBlogs,
        addBlog,
        updateBlog,
        deleteBlog,
        fetchBlogs,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export default BlogProvider;
