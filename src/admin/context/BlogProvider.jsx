import { createContext, useContext, useState, useEffect } from "react";

const BlogContext = createContext();

export const useBlog = () => useContext(BlogContext);

const API = import.meta.env.VITE_API_URL;

const BlogProvider = ({ children }) => {

  const [blogs, setBlogs] = useState([]);

  // GET BLOGS
  const fetchBlogs = async () => {
    const res = await fetch(`${API}/api/blogs`);
    const data = await res.json();
    setBlogs(data);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // ADD BLOG
  const addBlog = async (blog) => {

    await fetch(`${API}/api/blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(blog),
    });

    fetchBlogs();
  };

  // DELETE
  const deleteBlog = async (id) => {

    await fetch(`${API}/api/blogs/${id}`, {
      method: "DELETE",
    });

    fetchBlogs();
  };

  return (
    <BlogContext.Provider
      value={{
        blogs,
        addBlog,
        deleteBlog,
        fetchBlogs,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};

export default BlogProvider;