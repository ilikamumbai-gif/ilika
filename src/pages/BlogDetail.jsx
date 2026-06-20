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

const normalizeInternalLinks = (links = [], fallbackInternalLink = "") => {
  const source = Array.isArray(links) ? links : [];
  const seen = new Set();
  const normalized = [];

  source.forEach((item, index) => {
    const url = normalizeInternalLink(item?.url || item?.path || item?.href || "");
    if (!url) return;
    const key = url.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push({
      id: String(item?.id || `internal-link-${index + 1}`),
      label: String(item?.label || item?.title || "").trim() || `Related Link ${normalized.length + 1}`,
      url,
    });
  });

  const fallbackUrl = normalizeInternalLink(fallbackInternalLink);
  if (fallbackUrl && !seen.has(fallbackUrl.toLowerCase())) {
    normalized.unshift({
      id: "internal-link-primary",
      label: "Visit Product",
      url: fallbackUrl,
    });
  }

  return normalized;
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
        <div className="prose max-w-none overflow-hidden prose-sm sm:prose-lg prose-headings:break-words prose-headings:text-[#1C371C] prose-p:break-words prose-p:text-[#385238] prose-p:leading-7 sm:prose-p:leading-8 prose-li:break-words prose-li:text-[#385238] prose-a:break-all prose-a:text-[#801f1f] prose-img:w-full prose-img:rounded-2xl prose-img:object-cover prose-video:w-full prose-video:rounded-2xl prose-iframe:w-full prose-table:block prose-table:w-full prose-table:overflow-x-auto">
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
      <div className="prose max-w-none overflow-hidden prose-sm sm:prose-lg prose-headings:break-words prose-headings:text-[#1C371C] prose-p:break-words prose-p:text-[#385238] prose-p:leading-7 sm:prose-p:leading-8 prose-li:break-words prose-li:text-[#385238] prose-a:break-all prose-a:text-[#801f1f] prose-img:w-full prose-img:rounded-2xl prose-img:object-cover prose-video:w-full prose-video:rounded-2xl prose-iframe:w-full prose-table:block prose-table:w-full prose-table:overflow-x-auto">
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
  const blogInternalLinks = useMemo(
    () => normalizeInternalLinks(blog?.internalLinks, blog?.internalLink),
    [blog?.internalLinks, blog?.internalLink]
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

        <main className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-4 sm:py-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 rounded-full border border-[#d3ddd3] bg-white px-4 py-2 text-sm font-medium text-[#1C371C] transition hover:bg-[#f2f7f2]"
          >
             Back to blogs
          </Link>

          <article className="mt-5 space-y-8 sm:mt-6 sm:space-y-10">
            <header className="border-b border-[#e2ece2] pb-6 sm:pb-8">
              <Heading level="h1" heading={blog.title} align="left" />
              <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-6 text-[#5f705f] sm:mt-4 sm:text-sm">
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
                        className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[10px] border border-[#b94343] bg-[#b94343] px-5 py-3.5 text-center text-[15px] font-bold text-white transition hover:bg-[#a83b3b] sm:min-w-[200px] sm:w-auto sm:py-4 sm:text-base"
                      >
                        Add To Cart
                      </button>
                    ) : null}
                    <Link
                      to={blogInternalLink}
                      className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[10px] border border-[#1f1f1f] bg-white px-5 py-3.5 text-center text-[15px] font-bold text-[#1f1f1f] transition hover:bg-[#f6f2ef] sm:min-w-[200px] sm:w-auto sm:py-4 sm:text-base"
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

            {blogInternalLinks.length > 0 && (
              <section className="relative overflow-hidden rounded-[32px] border border-[#dfe8df] bg-[linear-gradient(135deg,#f7fbf7_0%,#eef5ee_55%,#fdf8f4_100%)] p-5 shadow-[0_18px_50px_rgba(28,55,28,0.06)] sm:p-7">
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-40 bg-[radial-gradient(circle_at_top,_rgba(185,67,67,0.12),_transparent_65%)] lg:block" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d3434]">
                      Continue Exploring
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold tracking-tight text-[#163016] sm:text-2xl lg:text-[2rem]">
                        Related Reads & Product Pages
                      </h2>
                      <span className="rounded-full border border-[#d4dfd4] bg-white/80 px-3 py-1 text-xs font-semibold text-[#4f654f]">
                        {blogInternalLinks.length} links
                      </span>
                    </div>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-[#587058] sm:text-[15px]">
                      Jump into the next useful page without losing context. These links are picked to keep the journey relevant and easy to follow.
                    </p>
                  </div>

                </div>

                <div className="relative mt-6 flex flex-wrap gap-2.5 sm:gap-3">
                  {blogInternalLinks.map((item, index) => (
                    <Link
                      key={`${item.id}-pill`}
                      to={item.url}
                      className="group inline-flex max-w-full items-center gap-2.5 rounded-full border border-[#d7e2d7] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1C371C] shadow-[0_8px_20px_rgba(28,55,28,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd1bf] hover:bg-[#fcfffc] hover:shadow-[0_12px_24px_rgba(28,55,28,0.08)] sm:gap-3 sm:px-5 sm:py-3 sm:text-sm"
                    >
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f4e5e2] px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8d3434]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 break-words leading-tight">{item.label}</span>
                      <span className="shrink-0 text-[#8d3434] transition group-hover:translate-x-0.5">-&gt;</span>
                    </Link>
                  ))}
                </div>

                <div className="hidden relative mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <Link
                    to={blogInternalLinks[0].url}
                    className="group rounded-[28px] border border-[#d9e4d9] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#bfd1bf] hover:shadow-[0_16px_35px_rgba(28,55,28,0.08)] sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex rounded-full bg-[#f4e5e2] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d3434]">
                          Featured Link
                        </span>
                        <h3 className="mt-4 text-xl font-semibold leading-snug text-[#1C371C] sm:text-2xl">
                          {blogInternalLinks[0].label}
                        </h3>
                        <p className="mt-3 max-w-md text-sm leading-6 text-[#5f705f]">
                          Open this page for a closely connected product or topic that naturally extends what you just read.
                        </p>
                      </div>
                      <span className="grid h-11 w-11 shrink-0 place-content-center rounded-full border border-[#e2ece2] bg-[#f8fbf8] text-lg text-[#8d3434] transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </Link>

                  <div className="grid gap-3">
                    {blogInternalLinks.slice(1).map((item, index) => (
                      <Link
                        key={item.id}
                        to={item.url}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-[#d9e4d9] bg-white/95 px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#bfd1bf] hover:bg-white hover:shadow-[0_12px_28px_rgba(28,55,28,0.06)] sm:px-5"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d3434]">
                            Link {String(index + 2).padStart(2, "0")}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#1C371C] sm:text-[15px]">
                            {item.label}
                          </p>
                        </div>
                        <span className="shrink-0 text-base text-[#8d3434] transition group-hover:translate-x-1">
                          →
                        </span>
                      </Link>
                    ))}

                    {blogInternalLinks.length === 1 ? (
                      <div className="rounded-2xl border border-dashed border-[#d6e0d6] bg-white/60 px-4 py-4 text-sm leading-6 text-[#6b7f6b]">
                        More related links can be added from the admin blog editor, and they will appear here automatically.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            )}
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
                className="w-full rounded-xl bg-[#1C371C] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163016] disabled:opacity-60 sm:w-auto"
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
