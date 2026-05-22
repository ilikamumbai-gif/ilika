import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";

const removeInlineImagesFromHtml = (html = "") =>
  String(html || "").replace(/<img[^>]*>/gi, "");

const renderSectionBlock = (section, index) => {
  if (!section) return null;

  const contentHtml = section.content || "";

  if (section.type === "content-full") {
    return (
      <div key={`${section.id || "section"}_${index}`} className="py-1">
        <div className="prose prose-lg max-w-none prose-headings:text-[#1C371C] prose-p:text-[#385238] prose-p:leading-8 prose-li:text-[#385238] prose-a:text-[#801f1f]">
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </div>
      </div>
    );
  }

  const imageEl = (
    <figure className="overflow-hidden rounded-2xl bg-[#f8fbf8]">
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
    </figure>
  );

  const contentEl = (
    <div className="py-1">
      <div className="prose prose-lg max-w-none prose-headings:text-[#1C371C] prose-p:text-[#385238] prose-p:leading-8 prose-li:text-[#385238] prose-a:text-[#801f1f]">
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </div>
  );

  return (
    <div key={`${section.id || "section"}_${index}`} className="grid gap-8 md:grid-cols-2 md:items-start">
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
        <div className="min-h-screen bg-white text-[#1C371C]">
          <Header />
          <CartDrawer />
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <p className="text-lg font-medium">Blog not found</p>
            <Link
              to="/blog"
              className="mt-4 inline-flex rounded-xl border border-[#cfdccf] px-4 py-2 text-sm font-semibold text-[#1C371C] transition hover:bg-[#f2f7f2]"
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
      <div className="min-h-screen bg-white text-[#1C371C]">
        <Header />
        <CartDrawer />

        <main className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 rounded-full border border-[#d3ddd3] bg-white px-4 py-2 text-sm font-medium text-[#1C371C] transition hover:bg-[#f2f7f2]"
          >
             Back to blogs
          </Link>

          <article className="mt-6 space-y-10">
            <header className="border-b border-[#e2ece2] pb-8">
              <Heading heading={blog.title} align="left" />
              <p className="mt-4 text-sm text-[#5f705f]">
                {formattedDate || "Latest"} | {blog.author || "Ilika Team"} | {comments.length} comments
              </p>
            </header>

            <div className="grid gap-8 md:grid-cols-2 md:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#801f1f]">Article Intro</p>
                <p className="mt-3 text-[15px] leading-7 text-[#4a5f4a] sm:text-base">
                  {blog.excerpt || "Discover practical beauty routines and ingredient insights curated for better self-care."}
                </p>
              </div>

              <figure className="overflow-hidden rounded-2xl bg-[#f8fbf8]">
                <img
                  loading="lazy"
                  src={blog.image}
                  alt={blog.title}
                  className="h-full min-h-[260px] w-full object-cover"
                />
              </figure>
            </div>

            {contentSections.map((section, index) => renderSectionBlock(section, index))}
          </article>

          <section className="mt-12 border-t border-[#e2ece2] pt-8">
            <h2 className="text-2xl font-semibold text-[#1C371C]">Comments ({comments.length})</h2>

            <form onSubmit={submitComment} className="mt-5 space-y-3 rounded-2xl border border-[#e2ece2] bg-white p-4 sm:p-5">
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
                className="rounded-xl bg-[#1C371C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163016] disabled:opacity-60"
              >
                {posting ? "Posting..." : "Post Comment"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {loadingComments ? (
                <p className="text-sm text-[#5f705f]">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-[#5f705f]">No comments yet. Be the first to comment.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1C371C]">{c.name}</p>
                      <p className="text-xs text-[#688068]">{new Date(c.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#4a5f4a]">{c.message}</p>
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
