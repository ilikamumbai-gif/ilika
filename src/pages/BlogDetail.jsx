import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import { useCart } from "../context/CartProvider";
import { useProducts } from "../admin/context/ProductContext";
import { createSlug, getProductSlug } from "../utils/slugify";
import { useSeo } from "../hooks/useSeo";
import { buildCartProductSnapshot, getDefaultVariant } from "../utils/productPricing";

const removeInlineImagesFromHtml = (html = "") =>
  String(html || "").replace(/<img[^>]*>/gi, "");

const normalizeInternalLink = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const normalizeRoutePath = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\/+$/, "");

const normalizeLookupValue = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();

const LANDING_ROUTE_PRODUCT_MATCHERS = {
  "/voice-mask-maker": [
    "ilika-voice-face-mask-maker-machine-with-collagen-peptide",
  ],
  "/nonvoice-mask-maker": [
    "ilika-non-voice-face-mask-maker-machine-with-collagen-peptide-diy-fresh-fruit-facial-mask-machine-for-glowing-skin",
  ],
  "/leafless-hair-dryer": [
    "ilika-high-speed-bldc-hair-dryer-fast-drying-professional-hair-dryer-with-ionic-technology-temperature-control",
  ],
  "/high-frequency-therapy-wand": [
    "ilika-high-frequency-therapy-wand-for-acne-treatment-skin-rejuvenation-hair-growth-scalp-care",
  ],
  "/hot-cold-blackhead-remover": [
    "ilika-blackhead-remover-hot-cold-for-deep-pore-cleansing-blackhead-removal",
    "ilika-blackhead-remover-hot-cold",
  ],
};

const matchesProductLookup = (product, lookups = []) => {
  if (!product || !Array.isArray(lookups) || !lookups.length) return false;

  const productSlug = normalizeLookupValue(product?.productUrl || product?.slug || "");
  const nameSlug = createSlug(product?.name || "");

  return lookups.some((lookup) => {
    const normalizedLookup = normalizeLookupValue(lookup);
    return (
      productSlug === normalizedLookup ||
      nameSlug === normalizedLookup
    );
  });
};

const renderSectionBlock = (section, index) => {
  if (!section) return null;

  const contentHtml = section.content || "";

  if (section.type === "content-full") {
    return (
      <div key={`${section.id || "section"}_${index}`} className="py-1">
        <div className="prose max-w-none prose-sm sm:prose-lg prose-headings:text-[#1C371C] prose-p:text-[#385238] prose-p:leading-7 sm:prose-p:leading-8 prose-li:text-[#385238] prose-a:text-[#801f1f]">
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
          className="h-full min-h-[200px] w-full object-cover sm:min-h-[220px]"
        />
      ) : (
        <div className="h-full min-h-[200px] w-full sm:min-h-[220px]" />
      )}
    </figure>
  );

  const contentEl = (
    <div className="py-1">
      <div className="prose max-w-none prose-sm sm:prose-lg prose-headings:text-[#1C371C] prose-p:text-[#385238] prose-p:leading-7 sm:prose-p:leading-8 prose-li:text-[#385238] prose-a:text-[#801f1f]">
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </div>
  );

  return (
    <div key={`${section.id || "section"}_${index}`} className="grid gap-5 sm:gap-6 md:grid-cols-2 md:items-start md:gap-8">
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
  const { addToCart } = useCart();
  const { products = [] } = useProducts();
  const { state: locationBlog } = useLocation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [blog, setBlog] = useState(locationBlog || null);

  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(!locationBlog);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const commentsSectionRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const loadBlog = async () => {
      if (!slug) {
        setLoadingBlog(false);
        return;
      }

      const stateSlug = String(locationBlog?.slug || createSlug(locationBlog?.title || ""))
        .trim()
        .toLowerCase();

      if (locationBlog?.id && stateSlug === String(slug).trim().toLowerCase()) {
        setBlog(locationBlog);
      }

      try {
        const bySlugRes = await fetch(`${API}/api/blogs/slug/${slug}`);
        if (bySlugRes.ok) {
          const bySlugData = await bySlugRes.json();
          if (!ignore) setBlog(bySlugData || null);
          return;
        }

        const byIdRes = await fetch(`${API}/api/blogs/${slug}`);
        if (byIdRes.ok) {
          const byIdData = await byIdRes.json();
          if (!ignore) setBlog(byIdData || null);
          return;
        }

        const listRes = await fetch(`${API}/api/blogs`);
        if (listRes.ok) {
          const listData = await listRes.json();
          const blogs = Array.isArray(listData) ? listData : [];
          const slugLower = String(slug).trim().toLowerCase();
          const matched = blogs.find((entry) => {
            const entrySlug = String(entry?.slug || createSlug(entry?.title || ""))
              .trim()
              .toLowerCase();
            return entrySlug === slugLower;
          });
          if (!ignore && matched) {
            setBlog(matched);
            return;
          }
        }

        if (!ignore) setBlog(null);
      } catch {
        if (!ignore) setBlog(null);
      } finally {
        if (!ignore) setLoadingBlog(false);
      }
    };

    loadBlog();
    return () => {
      ignore = true;
    };
  }, [API, slug, locationBlog]);

  useEffect(() => {
    const node = commentsSectionRef.current;
    if (!node || commentsVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCommentsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [commentsVisible]);

  useEffect(() => {
    if (!blog?.id || !commentsVisible) return;

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
  }, [API, blog?.id, commentsVisible]);

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

  const blogInternalLink = useMemo(
    () => normalizeInternalLink(blog?.internalLink),
    [blog?.internalLink]
  );

  const linkedProduct = useMemo(() => {
    if (!blogInternalLink || !Array.isArray(products) || products.length === 0) return null;

    const targetPath = normalizeRoutePath(blogInternalLink);
    const landingLookups = LANDING_ROUTE_PRODUCT_MATCHERS[targetPath] || [];

    return (
      products.find((product) => {
        const productSlug = getProductSlug(product);
        const productDetailPath = productSlug ? normalizeRoutePath(`/product/${productSlug}`) : "";

        return (
          productDetailPath === targetPath ||
          matchesProductLookup(product, landingLookups)
        );
      }) || null
    );
  }, [blogInternalLink, products]);

  const handleAddLinkedProductToCart = () => {
    if (!linkedProduct) return;

    const productId = linkedProduct._id || linkedProduct.id;
    const defaultVariant = getDefaultVariant(linkedProduct);
    const cartItem = buildCartProductSnapshot(linkedProduct, {
      variant: defaultVariant,
      cartId: defaultVariant ? `${productId}_${defaultVariant.id}` : productId,
    });

    addToCart(cartItem);
  };

  const blogSlug = useMemo(
    () => String(blog?.slug || createSlug(blog?.title || slug || "blog")).trim().toLowerCase(),
    [blog?.slug, blog?.title, slug]
  );

  const seoTitle = blog?.title
    ? `${blog.title} | Ilika Blog`
    : "Blog Details | Ilika";
  const seoDescription =
    blog?.excerpt ||
    "Read Ilika blog articles for skincare tips, beauty routines, and product insights.";
  const seoImage = blog?.image || "https://ilika.in/Images/logo2.webp";
  const seoKeywords = [
    "Ilika blog",
    "skincare tips",
    "beauty guide",
    blog?.title || "",
  ].filter(Boolean);

  useSeo({
    title: seoTitle,
    description: seoDescription,
    path: `/blog/${blogSlug}`,
    canonical: `/blog/${blogSlug}`,
    image: seoImage,
    type: "article",
    robots: blog ? "index, follow" : "noindex, follow",
    keywords: seoKeywords,
    jsonLd: blog
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: blog.title,
          description: seoDescription,
          image: [seoImage],
          author: {
            "@type": "Organization",
            name: blog.author || "Ilika Team",
          },
          publisher: {
            "@type": "Organization",
            name: "Ilika",
            logo: {
              "@type": "ImageObject",
              url: "https://ilika.in/Images/logo2.webp",
            },
          },
          datePublished: blog?.createdAt || undefined,
          dateModified: blog?.updatedAt || blog?.createdAt || undefined,
          mainEntityOfPage: `https://ilika.in/blog/${blogSlug}`,
        }
      : null,
  });

  useEffect(() => {
    if (!blog || !slug || !blogSlug) return;
    if (String(slug).trim().toLowerCase() === blogSlug) return;
    navigate(`/blog/${blogSlug}`, { replace: true });
  }, [blog, slug, blogSlug, navigate]);

  if (loadingBlog) {
    return (
      <>
        <MiniDivider />
        <div className="min-h-screen bg-white text-[#1C371C]">
          <Header />
          <CartDrawer />
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <p className="text-lg font-medium">Loading blog...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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

        <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 rounded-full border border-[#d3ddd3] bg-white px-4 py-2 text-sm font-medium text-[#1C371C] transition hover:bg-[#f2f7f2]"
          >
             Back to blogs
          </Link>

          <article className="mt-5 space-y-8 sm:mt-6 sm:space-y-10">
            <header className="border-b border-[#e2ece2] pb-6 sm:pb-8">
              <Heading level="h1" heading={blog.title} align="left" />
              <p className="mt-3 text-xs leading-6 text-[#5f705f] sm:mt-4 sm:text-sm">
                {formattedDate || "Latest"} | {blog.author || "Ilika Team"} | {comments.length} comments
              </p>
            </header>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:items-start md:gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#801f1f]">Article Intro</p>
                <p className="mt-3 text-[15px] leading-7 text-[#4a5f4a] sm:text-base sm:leading-8">
                  {blog.excerpt || "Discover practical beauty routines and ingredient insights curated for better self-care."}
                </p>
                {blogInternalLink ? (
                  <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-4">
                    {linkedProduct ? (
                      <button
                        type="button"
                        onClick={handleAddLinkedProductToCart}
                        className="inline-flex w-full items-center justify-center rounded-[10px] border border-[#b94343] bg-[#b94343] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#a83b3b] sm:min-w-[200px] sm:w-auto sm:py-4 sm:text-base"
                      >
                        Add To Cart
                      </button>
                    ) : null}
                    <Link
                      to={blogInternalLink}
                      className="inline-flex w-full items-center justify-center rounded-[10px] border border-[#1f1f1f] bg-white px-6 py-3.5 text-[15px] font-bold text-[#1f1f1f] transition hover:bg-[#f6f2ef] sm:min-w-[200px] sm:w-auto sm:py-4 sm:text-base"
                    >
                      Visit Product
                    </Link>
                  </div>
                ) : null}
              </div>

              <figure className="overflow-hidden rounded-2xl bg-[#f8fbf8]">
                <img
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  width="1200"
                  height="800"
                  src={blog.image}
                  alt={blog.title}
                  className="h-full min-h-[220px] w-full object-cover sm:min-h-[260px]"
                />
              </figure>
            </div>

            {contentSections.map((section, index) => renderSectionBlock(section, index))}
          </article>

          <section ref={commentsSectionRef} className="mt-10 border-t border-[#e2ece2] pt-6 sm:mt-12 sm:pt-8">
            <h2 className="text-xl font-semibold text-[#1C371C] sm:text-2xl">Comments ({comments.length})</h2>

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
              {!commentsVisible ? (
                <p className="text-sm text-[#5f705f]">Comments load when you reach this section.</p>
              ) : loadingComments ? (
                <p className="text-sm text-[#5f705f]">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-[#5f705f]">No comments yet. Be the first to comment.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-2xl bg-white p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
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
