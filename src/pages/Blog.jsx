import React, { useEffect, useMemo, useState } from "react";
import BlogCard from "../components/BlogCard";
import Header from "../components/Header";
import MiniDivider from "../components/MiniDivider";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const API = import.meta.env.VITE_API_URL;

const Blog = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    let ignore = false;

    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${API}/api/blogs`);
        const data = await res.json();
        if (!ignore) setBlogs(Array.isArray(data) ? data : []);
      } catch {
        if (!ignore) setBlogs([]);
      }
    };

    fetchBlogs();

    return () => {
      ignore = true;
    };
  }, []);

  const featuredBlog = useMemo(() => (blogs.length ? blogs[0] : null), [blogs]);
  const restBlogs = useMemo(() => (blogs.length > 1 ? blogs.slice(1) : []), [blogs]);

  return (
    <>
      <MiniDivider />
      <div className="min-h-screen bg-white text-[#24170f]">
        <Header />
        <CartDrawer />

        <section className="relative overflow-hidden border-b border-[#ececec] bg-white">
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#99603d]">Ilika Journal</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
              Beauty insights, routines, and skincare stories that feel premium.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#5e4f44] sm:text-base">
              Discover expert tips, ingredient deep-dives, and practical guides curated for healthier skin and better self-care.
            </p>
          </div>
        </section>

        <main className="mx-auto max-w-7xl bg-white px-4 py-8 sm:px-6 sm:py-10">
          {blogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9cfc5] bg-white/80 px-6 py-16 text-center text-[#7b6d62]">
              No blogs yet.
            </div>
          ) : (
            <div className="space-y-10">
              {featuredBlog && (
                <section>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f5b39]">Featured</p>
                  <div className="max-w-[360px]">
                    <BlogCard blog={featuredBlog} />
                  </div>
                </section>
              )}

              {restBlogs.length > 0 && (
                <section>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f5b39]">Latest Articles</p>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {restBlogs.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Blog;
