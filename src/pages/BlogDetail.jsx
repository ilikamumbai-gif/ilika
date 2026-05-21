import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

const removeInlineImagesFromHtml = (html = "") =>
  String(html || "").replace(/<img[^>]*>/gi, "");

const renderSectionBlock = (section, index) => {
  if (!section) return null;

  const contentHtml = section.content || "";

  if (section.type === "content-full") {
    return (
      <div key={`${section.id || "section"}_${index}`} className="rounded-[28px] bg-[#f5f5f5] p-5 sm:p-8">
        <div className="prose prose-lg max-w-none prose-headings:text-[#261a12] prose-p:text-[#4f443b] prose-p:leading-8 prose-li:text-[#4f443b] prose-a:text-[#9a5429]">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>
      </div>
    );
  }

  const imageEl = (
    <div className="overflow-hidden rounded-[28px] bg-[#f5f5f5]">
      {section.image ? (
        <img
          loading="lazy"
          src={section.image}
          alt={`Blog section ${index + 1}`}
          className="h-full min-h-[220px] w-full object-cover"
        />
      ) : (
        <div className="h-full min-h-[220px] w-full" />
      )}
    </div>
  );

  const contentEl = (
    <div className="rounded-[28px] bg-[#f5f5f5] p-5 sm:p-7">
      <div className="prose prose-lg max-w-none prose-headings:text-[#261a12] prose-p:text-[#4f443b] prose-p:leading-8 prose-li:text-[#4f443b] prose-a:text-[#9a5429]">
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </div>
  );

  return (
    <div key={`${section.id || "section"}_${index}`} className="grid gap-5 md:grid-cols-2">
      {section.type === "image-content" ? (
        <>
          {imageEl}
          {contentEl}
        </>
      ) : (
        <>
          {contentEl}
          {imageEl}
        </>
      )}
    </div>
  );
};

const BlogDetail = () => {
  const { state: blog } = useLocation();
  const API = import.meta.env.VITE_API_URL;

  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!blog?.id) return;

    const loadComments = async () => {
      try {
        const res = await fetch(`${API}/api/blogs/${blog.id}/comments`);
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [API, blog?.id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim() || !blog?.id) return;

    try {
      setPosting(true);
      const res = await fetch(`${API}/api/blogs/${blog.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      const newComment = await res.json();
      setComments((prev) => [newComment, ...prev]);
      setName("");
      setMessage("");
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setPosting(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!blog?.createdAt) return "";
    return new Date(blog.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [blog?.createdAt]);

  const structuredContentHtml = useMemo(
    () => removeInlineImagesFromHtml(blog?.content || ""),
    [blog?.content]
  );

  const contentSections = useMemo(() => {
    if (Array.isArray(blog?.contentSections) && blog.contentSections.length > 0) {
      return blog.contentSections;
    }

    return [{ type: "content-full", content: structuredContentHtml }];
  }, [blog?.contentSections, structuredContentHtml]);

  if (!blog) {
    return (
      <>
        <MiniDivider />
        <div className="min-h-screen bg-white text-[#24170f]">
          <Header />
          <CartDrawer />
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <p className="text-lg font-medium">Blog not found</p>
            <Link
              to="/blog"
              className="mt-4 inline-flex rounded-xl border border-[#d7c4b6] px-4 py-2 text-sm font-semibold text-[#7b4729] transition hover:bg-[#fff5ed]"
            >
              Back to Blogs
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <MiniDivider />
      <div className="min-h-screen bg-white text-[#24170f]">
        <Header />
        <CartDrawer />

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 rounded-full border border-[#e2d4c8] bg-white px-4 py-2 text-sm font-medium text-[#654b3c] transition hover:bg-[#fff8f1]"
          >
             Back to blogs
          </Link>

          <article className="mt-5 space-y-6">
            <div className="rounded-2xl bg-[#f5f5f5] px-5 py-4 sm:px-7">
              <h1 className="text-center text-3xl font-semibold leading-tight text-[#261a12] sm:text-4xl">
                {blog.title}
              </h1>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[28px] bg-[#f5f5f5] p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8d735f]">Article Intro</p>
                <p className="mt-3 text-[15px] leading-7 text-[#5f5247] sm:text-base">
                  {blog.excerpt || "Discover practical beauty routines and ingredient insights curated for better self-care."}
                </p>
                <p className="mt-4 text-sm text-[#6b5d52]">
                  {formattedDate || "Latest"} · {blog.author || "Ilika Team"} · {comments.length} comments
                </p>
              </div>

              <div className="overflow-hidden rounded-[28px] bg-[#f5f5f5]">
                <img
                  loading="lazy"
                  src={blog.image}
                  alt={blog.title}
                  className="h-full min-h-[260px] w-full object-cover"
                />
              </div>
            </div>

            {contentSections.map((section, index) => renderSectionBlock(section, index))}
          </article>

          <section className="mt-8 rounded-[24px] bg-[#f5f5f5] p-5 sm:p-8">
            <h2 className="text-2xl font-semibold text-[#261a12]">Comments ({comments.length})</h2>

            <form onSubmit={submitComment} className="mt-5 space-y-3 rounded-2xl bg-white p-4 sm:p-5">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-[#f8f8f8] px-3 py-2.5 text-sm outline-none"
                required
              />

              <textarea
                placeholder="Write a thoughtful comment..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-24 w-full rounded-xl bg-[#f8f8f8] px-3 py-2.5 text-sm outline-none"
                required
              />

              <button
                disabled={posting}
                className="rounded-xl bg-[#2c1b12] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f120c] disabled:opacity-60"
              >
                {posting ? "Posting..." : "Post Comment"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {loadingComments ? (
                <p className="text-sm text-[#7d6e62]">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-[#7d6e62]">No comments yet. Be the first to comment.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#2f2218]">{c.name}</p>
                      <p className="text-xs text-[#907f72]">{new Date(c.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#5d5046]">{c.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default BlogDetail;
