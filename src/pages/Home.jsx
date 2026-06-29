import React, { Suspense, lazy, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, BadgeDollarSign, ShieldCheck, Truck, LifeBuoy } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Heading from "../components/Heading";
import OptimizedImage from "../components/OptimizedImage";
import { categoriesData } from "../Dummy/categoriesData";
import SkinTypeBanner from "../components/SkinTypeBanner";

import { CategoryContext } from "../admin/context/CategoryContext";
import { ProductContext } from "../admin/context/ProductContext";
import { getProductSlug } from "../utils/slugify";

const ProductList = lazy(() => import("../components/ProductList"));
import Banner from "../components/Banner";
const CartDrawer = lazy(() => import("../components/CartDrawer"));
const Footer = lazy(() => import("../components/Footer"));
const CategoryNav = lazy(() => import("../components/CategoryNav"));
const HomeDivisionSttrip = lazy(() => import("../components/HomeDivisionSttrip"));
const HomeTrendingShowcase = lazy(() => import("../components/HomeTrendingShowcase"));
const GroomingLeadOffer = lazy(() => import("../components/GroomingLeadOffer"));

const Carousel = lazy(() => import("../components/Carousel"));

const Menifesto = lazy(() => import("../components/Menifesto"));
const MyCtmRoutine = lazy(() => import("../components/MyCtmRoutine"));
const TestimonialList = lazy(() => import("../components/TestimonialList"));
import blackSeedLandingImage from "../Landing/assets/Blackseed1.png";
import herbalLandingImage from "../Landing/assets/Herbal1.png";

const hairBannerDesktop = "/Homepage/homepagehairbanner.jpg";
const hairBannerMobile = "/Homepage/homepagehairbannermobile.jpg";
const BannerStyle = "/Images/Banner.webp";
const endBannerDesktop = "/Homepage/homepagemaskcome1banner.jpg";
const endBannerMobile = "/Homepage/homepagemaskcome1banner.jpg";
const end2BannerDesktop = "/Homepage/homepagemaskcombo2banner.png";
const end2BannerMobile = "/Homepage/homepagemaskcombo2banner.png";
const end3BannerDesktop = "/Homepage/homepagemaskcombo3banner.png";
const end3BannerMobile = "/Homepage/homepagemaskcombo3banner.png";
const maskBannerDesktop = "/Images/mask.webp";
const maskBannerMobile = "/Images/mask.webp";
const homePageCtmBannerDesktop = "/Homepage/homepagebannerctm.jpg";
const homePageCtmBannerMobile = "/Homepage/homepagebannerctm.jpg";


const HAIR_CAROUSEL_ITEMS = [
  { title: "Healthy Hair Growth", image: "/Images/hairc5.webp", bgColor: "", link: "/hair/care" },
  { title: "Hair Fall Control", image: "/Images/hairc1.webp", bgColor: "", link: "/hair/care" },
  { title: "Dandruff-Free Scalp", image: "/Images/hairc2.webp", bgColor: "", link: "/hair/care" },
  { title: "Dry & Damaged Hair", image: "/Images/hairc3.webp", bgColor: "", link: "/hair/care" },
  { title: "Frizz-Free Smoothness", image: "/Images/hairc4.webp", bgColor: "", link: "/hair/care" },
  { title: "Deep Hair Repair", image: "/Images/hairc6.webp", bgColor: "", link: "/hair/care" },
  { title: "Soft & Shiny Hair", image: "/Images/hairc2.webp", bgColor: "", link: "/hair/care" },
  { title: "Scalp Hydration", image: "/Images/hairc4.webp", bgColor: "", link: "/hair/care" },
];

  
const SKIN_CAROUSEL_ITEMS = [
  { title: "Bright & Glowing Skin", image: "/Images/skinc1.webp", bgColor: "#f7b4c9", link: "/skin" },
  { title: "Acne & Pimple Care", image: "/Images/skinc2.webp", bgColor: "#f6e285", link: "/skin" },
  { title: "Deep Hydration", image: "/Images/skinc3.webp", bgColor: "#93caf6", link: "/skin" },
  { title: "Dark Spot Reduction", image: "/Images/skinc4.webp", bgColor: "#cce8a9", link: "/skin" },
  { title: "Anti-Aging Care", image: "/Images/skinc5.webp", bgColor: "#ceb2f4", link: "/skin" },
  { title: "Skin Barrier Repair", image: "/Images/skinc6.webp", bgColor: "#f6e7c7", link: "/skin" },
  { title: "Soft & Smooth Skin", image: "/Images/skinc7.webp", bgColor: "#ef5360", link: "/skin" },
  { title: "Oil Control Care", image: "/Images/skinc8.webp", bgColor: "#d8b9a1", link: "/skin" },
];

const HOME_SUPPORT_ITEMS = [
  {
    title: "COD Available",
    subtitle: "Cash on delivery option",
    icon: BadgeDollarSign,
  },
  {
    title: "Secure Payment",
    subtitle: "Protected checkout",
    icon: ShieldCheck,
  },
  {
    title: "Free Delivery",
    subtitle: "Fast doorstep shipping",
    icon: Truck,
  },
  {
    title: "Warranty Support",
    subtitle: "We’re here to help",
    icon: LifeBuoy,
  },
];

const normalizeName = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getProductImage = (product, fallback) =>
  product?.variants?.[0]?.images?.[0] ||
  product?.images?.[0] ||
  product?.image ||
  product?.imageUrl ||
  fallback;

const getYouTubeVideoId = (url = "") => {
  try {
    if (!url) return "";
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split(/[?&]/)[0] || "";
    }
    if (url.includes("/shorts/")) {
      return url.split("/shorts/")[1]?.split(/[?&]/)[0] || "";
    }
    return new URL(url).searchParams.get("v") || "";
  } catch {
    return "";
  }
};

const getDriveFileId = (url = "") => {
  if (!url) return "";
  const fromFilePath = url.match(/\/d\/([^/]+)/)?.[1];
  if (fromFilePath) return fromFilePath;
  try {
    return new URL(url).searchParams.get("id") || "";
  } catch {
    return "";
  }
};

const getDriveThumbnailCandidates = (fileId = "") => {
  const id = String(fileId || "").trim();
  if (!id) return [];

  return [
    `https://lh3.googleusercontent.com/d/${id}=w1000`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
    `https://drive.google.com/uc?export=view&id=${id}`,
  ];
};

const getHonestReviewMedia = (url = "", { preview = true } = {}) => {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return { kind: "video", src: "" };

  const withParams = (base, params) => {
    const queryString = new URLSearchParams(params).toString();
    return `${base}${base.includes("?") ? "&" : "?"}${queryString}`;
  };

  try {
    if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
      const videoId = getYouTubeVideoId(rawUrl);
      return videoId
        ? {
            kind: "iframe",
            src: withParams(`https://www.youtube-nocookie.com/embed/${videoId}`, {
              autoplay: 1,
              mute: preview ? 1 : 0,
              playsinline: 1,
              loop: preview ? 1 : 0,
              playlist: preview ? videoId : undefined,
              rel: 0,
              modestbranding: 1,
              controls: preview ? 0 : 1,
              fs: preview ? 0 : 1,
              disablekb: preview ? 1 : 0,
            }),
          }
        : { kind: "video", src: "" };
    }

    if (rawUrl.includes("drive.google.com")) {
      const fileId = getDriveFileId(rawUrl);
      return fileId
        ? {
            kind: preview ? "thumbnail" : "iframe",
            src: preview
              ? getDriveThumbnailCandidates(fileId)[0]
              : withParams(`https://drive.google.com/file/d/${fileId}/preview`, {
                  autoplay: 1,
                  mute: 0,
                  controls: 1,
                  playsinline: 1,
                  embedded: 1,
                }),
          }
        : { kind: "video", src: "" };
    }
  } catch {
    return { kind: "video", src: rawUrl };
  }

  return { kind: "video", src: rawUrl };
};

const HomeHonestReviewLightbox = ({ item, onClose }) => {
  const media = getHonestReviewMedia(item?.url, { preview: false });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!item || !media.src) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[430px] overflow-hidden rounded-[30px] bg-black shadow-[0_18px_50px_rgba(0,0,0,0.4)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-xl text-white transition hover:bg-black/75"
          aria-label="Close honest review video"
        >
          ×
        </button>

        {media.kind === "iframe" ? (
          <iframe
            src={media.src}
            title={item.title || "Honest review video"}
            className="h-[78vh] w-full bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video
            src={media.src}
            title={item.title || "Honest review video"}
            className="h-[78vh] w-full bg-black object-cover"
            autoPlay
            loop
            playsInline
            preload="metadata"
            controls
          />
        )}
      </div>
    </div>
  );
};

const HomeHonestReviewCard = ({ item, onOpen }) => {
  const media = getHonestReviewMedia(item.url, { preview: true });
  const driveFileId = item?.url?.includes("drive.google.com") ? getDriveFileId(item.url) : "";
  const thumbnailCandidates = useMemo(() => {
    if (media.kind !== "thumbnail") return media.src ? [media.src] : [];
    if (!driveFileId) return media.src ? [media.src] : [];

    const candidates = getDriveThumbnailCandidates(driveFileId);
    return media.src && !candidates.includes(media.src) ? [media.src, ...candidates] : candidates;
  }, [driveFileId, media.kind, media.src]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const thumbnailSrc = thumbnailCandidates[thumbnailIndex] || "";

  return (
    <div
      data-home-honest-review-card="true"
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen?.(item);
        }
      }}
      className="group relative min-w-[220px] max-w-[220px] shrink-0 snap-start overflow-hidden rounded-[28px] bg-white text-left shadow-[0_12px_30px_rgba(69,39,34,0.12)] sm:min-w-[260px] sm:max-w-[260px]"
    >
      {media.kind === "thumbnail" ? (
        thumbnailSrc ? (
          <div className="relative h-[420px] w-full overflow-hidden bg-[#e8d8d1] sm:h-[470px]">
            <img
              src={thumbnailSrc}
              alt={item.title || "Honest review preview"}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => {
                setThumbnailIndex((current) =>
                  current < thumbnailCandidates.length - 1 ? current + 1 : current
                );
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
          </div>
        ) : (
          <div className="relative flex h-[420px] w-full items-end overflow-hidden bg-gradient-to-br from-[#e8d8d1] via-[#f4ebe7] to-[#dbc5bc] p-5 sm:h-[470px]">
            <div className="max-w-[70%] text-left">
              <p className="text-sm font-semibold text-[#2f1f1a]">
                {item.title || "Honest Review"}
              </p>
              <p className="mt-1 text-xs text-[#5b4339]">Tap to open video</p>
            </div>
          </div>
        )
      ) : media.kind === "iframe" ? (
        <iframe
          src={media.src}
          title={item.title || "Honest review video"}
          className="pointer-events-none h-[420px] w-full bg-black sm:h-[470px]"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <video
          src={media.src}
          title={item.title || "Honest review video"}
          className="h-[420px] w-full bg-black object-cover sm:h-[470px]"
          autoPlay
          muted
          defaultMuted
          loop
          playsInline
          preload="metadata"
          controls={false}
          onLoadedMetadata={(event) => {
            event.currentTarget.muted = true;
            event.currentTarget.defaultMuted = true;
            event.currentTarget.volume = 0;
            const playPromise = event.currentTarget.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
          {item.productName}
        </p>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-white">
          {item.title || "Honest Review"}
        </p>
      </div>

      <span className="pointer-events-none absolute right-4 top-4 z-10 text-white/90">↗</span>
    </div>
  );
};

const LazyMountSection = ({
  children,
  minHeight = 320,
  className = "",
  rootMargin = "40px 0px",
  placeholder = null,
}) => {
  const sectionRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsMounted(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <section
      ref={sectionRef}
      className={className}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `1px ${minHeight}px`,
      }}
    >
      {isMounted ? children : (placeholder || <div style={{ minHeight }} />)}
    </section>
  );
};

const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-[20px] bg-[#eadfda] ${className}`} />
);

const HomeSectionSkeleton = ({
  minHeight = 320,
  className = "",
  contentClassName = "",
  children,
}) => (
  <div
    className={`w-full px-4 py-6 sm:px-6 lg:px-8 ${className}`}
    style={{ minHeight }}
  >
    <div className={`mx-auto max-w-7xl ${contentClassName}`}>
      {children}
    </div>
  </div>
);

const CategoryNavSkeleton = () => (
  <HomeSectionSkeleton minHeight={220} className="bg-white py-4">
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="space-y-3 text-center">
          <SkeletonBlock className="mx-auto h-20 w-full max-w-[140px] rounded-[24px]" />
          <SkeletonBlock className="mx-auto h-4 w-20 rounded-full" />
        </div>
      ))}
    </div>
  </HomeSectionSkeleton>
);

const TrendingShowcaseSkeleton = ({ minHeight = 360, dark = false }) => (
  <HomeSectionSkeleton
    minHeight={minHeight}
    className={dark ? "bg-[#120b0a] py-8" : "bg-white py-8"}
  >
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className={`h-8 w-64 ${dark ? "bg-white/12" : ""}`} />
        <SkeletonBlock className={`h-4 w-80 max-w-full ${dark ? "bg-white/10" : ""}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <SkeletonBlock className={`aspect-[0.82] w-full rounded-[28px] ${dark ? "bg-white/10" : ""}`} />
            <SkeletonBlock className={`h-5 w-[82%] ${dark ? "bg-white/12" : ""}`} />
            <SkeletonBlock className={`h-4 w-28 ${dark ? "bg-white/10" : ""}`} />
          </div>
        ))}
      </div>
    </div>
  </HomeSectionSkeleton>
);

const DividerStripSkeleton = () => (
  <HomeSectionSkeleton minHeight={120} className="py-4">
    <SkeletonBlock className="h-[118px] w-full rounded-none bg-[#d8a2a1]" />
  </HomeSectionSkeleton>
);

const ProductShelfSkeleton = ({
  minHeight = 620,
  dark = false,
  showCircleRow = false,
}) => (
  <HomeSectionSkeleton
    minHeight={minHeight}
    className={dark ? "bg-[#120b0a] py-8" : "bg-white py-8"}
  >
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className={`h-8 w-72 ${dark ? "bg-white/12" : ""}`} />
        <SkeletonBlock className={`h-4 w-96 max-w-full ${dark ? "bg-white/10" : ""}`} />
      </div>
      {showCircleRow ? (
        <div className="flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <SkeletonBlock className="h-[170px] w-[170px] rounded-full" />
              <SkeletonBlock className="mx-auto h-4 w-28" />
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <SkeletonBlock className={`aspect-[0.82] w-full rounded-[28px] ${dark ? "bg-white/10" : ""}`} />
            <SkeletonBlock className={`h-5 w-[80%] ${dark ? "bg-white/12" : ""}`} />
            <SkeletonBlock className={`h-4 w-24 ${dark ? "bg-white/10" : ""}`} />
          </div>
        ))}
      </div>
    </div>
  </HomeSectionSkeleton>
);

const RoutineSkeleton = () => (
  <HomeSectionSkeleton minHeight={340} className="bg-white py-8">
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="space-y-4">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-full max-w-[520px]" />
        <SkeletonBlock className="h-4 w-[88%] max-w-[460px]" />
        <div className="flex gap-3 pt-2">
          <SkeletonBlock className="h-11 w-36 rounded-full" />
          <SkeletonBlock className="h-11 w-36 rounded-full" />
        </div>
      </div>
      <SkeletonBlock className="aspect-[4/3] w-full rounded-[32px]" />
    </div>
  </HomeSectionSkeleton>
);

const LandingPagesSkeleton = () => (
  <HomeSectionSkeleton minHeight={420} className="bg-black py-8">
    <div className="space-y-6">
      <SkeletonBlock className="h-4 w-40 bg-white/12" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBlock key={index} className="aspect-[4/5.25] w-full rounded-[28px] bg-white/10" />
        ))}
      </div>
    </div>
  </HomeSectionSkeleton>
);

const TrustStripSkeleton = () => (
  <div className="bg-[#b34140] px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-0 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[92px] flex-col items-center justify-center gap-3 border-white/20 px-3 py-5 text-center sm:min-h-[108px] sm:px-4 sm:py-6 md:border-r"
        >
          <SkeletonBlock className="h-10 w-10 rounded-full bg-white/25" />
          <SkeletonBlock className="h-4 w-24 bg-white/20" />
          <SkeletonBlock className="h-3 w-28 bg-white/15" />
        </div>
      ))}
    </div>
  </div>
);

const TestimonialsSkeleton = () => (
  <HomeSectionSkeleton minHeight={340} className="bg-white py-8">
    <div className="space-y-6">
      <div className="space-y-3 text-center">
        <SkeletonBlock className="mx-auto h-8 w-56" />
        <SkeletonBlock className="mx-auto h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-[24px] border border-[#efe5e1] p-5">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-[90%]" />
            <SkeletonBlock className="h-4 w-[70%]" />
          </div>
        ))}
      </div>
    </div>
  </HomeSectionSkeleton>
);

const FooterSkeleton = () => (
  <div className="bg-[#f8f1ee] px-4 py-10 sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <SkeletonBlock className="h-5 w-28" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-[82%]" />
          <SkeletonBlock className="h-4 w-[64%]" />
        </div>
      ))}
    </div>
  </div>
);

const Home = () => {
  const categoryCtx = useContext(CategoryContext);
  const productCtx = useContext(ProductContext);
  const categories = categoryCtx?.categories || [];
  const products = productCtx?.products || [];
  const activeProducts = useMemo(
    () => products.filter((item) => item.isActive !== false),
    [products]
  );
  const [skinStart, setSkinStart] = useState(0);
  const [hairStart, setHairStart] = useState(0);
  const [landingStart, setLandingStart] = useState(0);
  const [activeHonestReview, setActiveHonestReview] = useState(null);
  const honestReviewsScrollRef = useRef(null);
  const honestReviewsPausedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { hairstylingCategory, skincareCategory, haircareCategory } = useMemo(() => {
    const byName = new Map(
      categories.map((c) => [String(c?.name || "").toLowerCase().replace(/\s+/g, ""), c])
    );
    return {
      hairstylingCategory: byName.get("hairstyling"),
      skincareCategory: byName.get("skincare"),
      haircareCategory: byName.get("haircare"),
    };
  }, [categories]);
  const hairBannerProductLink = useMemo(() => {
    const targetProduct = activeProducts.find((item) => {
      const name = String(item?.name || "").toLowerCase();
      return name.includes("black seed") || name.includes("hair oil");
    });

    if (!targetProduct) return "/hair/care";
    return `/product/${getProductSlug(targetProduct)}`;
  }, [activeProducts]);
  const skinTotal = useMemo(
    () =>
      skincareCategory
        ? activeProducts.filter((item) =>
          item.categoryIds?.includes(skincareCategory.id)
        ).length
        : 0,
    [activeProducts, skincareCategory]
  );
  const hairTotal = useMemo(
    () =>
      haircareCategory
        ? activeProducts.filter((item) =>
          item.categoryIds?.includes(haircareCategory.id)
        ).length
        : 0,
    [activeProducts, haircareCategory]
  );
  const landingCards = useMemo(() => {
    const nonVoiceMaskMaker = products.find((product) => {
      const name = normalizeName(product?.name);
      return name.includes("non voice") && name.includes("mask maker");
    });
    const voiceMaskMaker = products.find((product) => {
      const name = normalizeName(product?.name);
      return name.includes("voice face mask maker") && !name.includes("non voice");
    });
    const hfWand = products.find((product) => {
      const name = normalizeName(product?.name);
      const productUrl = normalizeName(product?.productUrl);
      return (
        name ===
          "ilika high frequency therapy wand for acne treatment skin rejuvenation hair growth scalp care" ||
        productUrl ===
          "ilika high frequency therapy wand for acne treatment skin rejuvenation hair growth scalp care" ||
        String(product?.productUrl || "").trim().toLowerCase() === "ilika-high-frequency-therapy-wand"
      );
    });
    const hairDryer = products.find((product) => {
      const name = normalizeName(product?.name);
      return name.includes("leafless hair dryer") || name.includes("high speed bldc hair dryer");
    });
    const blackheadRemover = products.find((product) => {
      const name = normalizeName(product?.name);
      return (
        (name.includes("blackhead remover") || name.includes("facial pore cleanser")) &&
        name.includes("hot") &&
        name.includes("cold")
      );
    });
    const blackSeedHairOil = products.find((product) => {
      const name = normalizeName(product?.name);
      return name.includes("black seed hair growth oil");
    });
    const herbalHairOil = products.find((product) => {
      const name = normalizeName(product?.name);
      return (
        name.includes("10 herbs herbal hair growth oil") ||
        name.includes("hair fall control") ||
        name.includes("strong healthy hair")
      );
    });

    return [
      {
        id: "landing-hot-cold-blackhead-remover",
        title: "Explore Ilika Blackhead Remover - Hot & Cold",
        author: "Team Ilika",
        eyebrow: "Clear pores with hot-cold care.",
        image: getProductImage(blackheadRemover, "/Images/MaskMakercard.webp"),
        linkPath: "/hot-cold-blackhead-remover",
      },
      {
        id: "landing-high-frequency-therapy-wand",
        title: "Explore Ilika High Frequency Therapy Wand",
        author: "Team Ilika",
        eyebrow: "Target acne, glow, and scalp care.",
        image: getProductImage(hfWand, "/Images/MaskMakercard.webp"),
        linkPath: "/high-frequency-therapy-wand",
      },
      {
        id: "landing-leafless-hairdryer",
        title: "Explore Ilika High-Speed Leafless Hair Dryer",
        author: "Team Ilika",
        eyebrow: "High-speed styling, simplified.",
        image: getProductImage(hairDryer, "/Images/HairdrayerCard.webp"),
        linkPath: "/leafless-hair-dryer",
      },
      {
        id: "landing-nonvoice-mask-maker",
        title: "Explore Ilika Non-Voice Face Mask Maker Machine",
        author: "Team Ilika",
        eyebrow: "DIY skincare in one easy ritual.",
        image: getProductImage(nonVoiceMaskMaker, "/Images/MaskMakercard.webp"),
        linkPath: "/nonvoice-mask-maker",
      },
      {
        id: "landing-voice-mask-maker",
        title: "Explore Ilika Voice Face Mask Maker Machine",
        author: "Team Ilika",
        eyebrow: "Fresh masks made at home.",
        image: getProductImage(voiceMaskMaker, "/Images/MaskMakercard.webp"),
        linkPath: "/voice-mask-maker",
      },
      {
        id: "landing-blackseed-hair-oil",
        title: "Explore Ilika Black Seed Hair Growth Oil",
        author: "Team Ilika",
        eyebrow: "Hair ritual for stronger roots.",
        image: getProductImage(blackSeedHairOil, blackSeedLandingImage),
        linkPath: "/blackseed-hair-oil",
      },
      {
        id: "landing-herbal-hair-oil",
        title: "Explore Ilika Herbal Hair Growth Oil",
        author: "Team Ilika",
        eyebrow: "Botanical care for healthier hair.",
        image: getProductImage(herbalHairOil, herbalLandingImage),
        linkPath: "/herbal-hair-oil",
      },
    ];
  }, [products]);
  const visibleLandingDesktopCount = Math.min(3, landingCards.length || 0);
  const canSlideLandingDesktop = landingCards.length > visibleLandingDesktopCount;
  const maxLandingDesktopStart = Math.max(landingCards.length - visibleLandingDesktopCount, 0);
  const visibleLandingCards = landingCards.slice(
    landingStart,
    landingStart + visibleLandingDesktopCount
  );
  const homeHonestReviews = useMemo(() => {
    const uniqueReviews = new Map();

    activeProducts.forEach((product) => {
      const rawItems = Array.isArray(product?.honestReviews) ? product.honestReviews : [];

      rawItems.forEach((item, index) => {
          const url = String(item?.url || item || "").trim();
          if (!url) return;

          const uniqueKey = url.toLowerCase();
          if (uniqueReviews.has(uniqueKey)) return;

          uniqueReviews.set(uniqueKey, {
            id: `${product?.id || product?.name || "product"}-honest-review-${index + 1}`,
            url,
            title: String(item?.title || "").trim() || "Honest Review",
            productName: String(product?.name || "").trim() || "Ilika Product",
            productLink: `/product/${getProductSlug(product)}`,
          });
        });
    });

    return Array.from(uniqueReviews.values());
  }, [activeProducts]);
  const autoScrollHonestReviews = useMemo(() => {
    if (homeHonestReviews.length <= 1) return homeHonestReviews;
    return [...homeHonestReviews, ...homeHonestReviews, ...homeHonestReviews];
  }, [homeHonestReviews]);

  useEffect(() => {
    const container = honestReviewsScrollRef.current;
    if (!container || homeHonestReviews.length <= 1) return undefined;

    let animationFrameId = 0;
    let lastTimestamp = 0;
    const speed = 220;

    const getLoopWidth = () => container.scrollWidth / 3;
    const setInitialPosition = () => {
      const loopWidth = getLoopWidth();
      if (loopWidth > 0) {
        container.scrollLeft = loopWidth;
      }
    };

    setInitialPosition();

    const handleResize = () => {
      const loopWidth = getLoopWidth();
      if (loopWidth <= 0) return;

      const normalizedOffset =
        ((container.scrollLeft % loopWidth) + loopWidth) % loopWidth;
      container.scrollLeft = loopWidth + normalizedOffset;
    };

    const step = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const singleLoopWidth = getLoopWidth();
      if (singleLoopWidth <= container.clientWidth) {
        animationFrameId = window.requestAnimationFrame(step);
        return;
      }

      if (honestReviewsPausedRef.current) {
        animationFrameId = window.requestAnimationFrame(step);
        return;
      }

      const nextScrollLeft = container.scrollLeft + (speed * delta) / 1000;
      const maxScrollLeft = singleLoopWidth * 2;

      if (nextScrollLeft >= maxScrollLeft) {
        container.scrollLeft = nextScrollLeft - singleLoopWidth;
      } else if (nextScrollLeft <= 0) {
        container.scrollLeft = nextScrollLeft + singleLoopWidth;
      } else {
        container.scrollLeft = nextScrollLeft;
      }

      animationFrameId = window.requestAnimationFrame(step);
    };

    window.addEventListener("resize", handleResize);
    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [homeHonestReviews]);

  const getVisibleCount = (total) => {
    if (total <= 0) return 0;
    return Math.min(4, total);
  };
  const canSlide = (total) => total > getVisibleCount(total);
  const nextPageStart = (current, total) => {
    const step = getVisibleCount(total);
    if (total <= step) return 0;
    const next = current + step;
    return next >= total ? 0 : next;
  };
  const prevPageStart = (current, total) => {
    const step = getVisibleCount(total);
    if (total <= step) return 0;
    const prev = current - step;
    return prev < 0 ? Math.max(total - step, 0) : prev;
  };

  return (
    <>
      <MiniDivider />

      <div className="relative primary-bg-color">

        <Header />
        <Suspense fallback={null}>
          <CartDrawer />
        </Suspense>
        <main>
          <Banner
            className="mt-0 bg-[#fdecef]"
            slides={[
              {
                desktopSrc: maskBannerDesktop,
                mobileSrc: maskBannerMobile,
                linkUrl: "/voice-mask-maker",
                alt: "Voice Mask Maker Banner",
              },
              {
                desktopSrc: endBannerDesktop,
                mobileSrc: endBannerMobile,
                linkUrl: "/mask-combo",
                alt: "Mask Combo Offer Banner",
              },
                {
                  desktopSrc: end2BannerDesktop,
                  mobileSrc: end2BannerMobile,
                  linkUrl: "/mask-combo#mask-combo-banner-2",
                  alt: "Mask Combo Banner",
                },
                {
                  desktopSrc: end3BannerDesktop,
                  mobileSrc: end3BannerMobile,
                  linkUrl: "/mask-combo#mask-combo-banner-3",
                  alt: "24K Gold Mask Combo Banner",
                },
                {
                  desktopSrc: homePageCtmBannerDesktop,
                  mobileSrc: homePageCtmBannerMobile,
                  linkUrl: "/ctm",
                  alt: "CTM Banner",
              },

            ]}
            imageFit="contain"
            autoSlideMs={5000}
            showControls
            priority
            preserveFullImage
          />

          <Suspense fallback={null}>
            <GroomingLeadOffer
              pageKey="home-page"
              popupDelayMs={1800}
            />
          </Suspense>

          {/* <SkinTypeBanner /> */}


          {/* CATERGORY NAV AND TRENDING PICKS  */}
          {isMobile ? (
            <>
              <LazyMountSection minHeight={220}>
                <Suspense fallback={<CategoryNavSkeleton />}>
                  {/* CATEGORY NAV */}
                  <CategoryNav categories={categoriesData} />
                </Suspense>
              </LazyMountSection>

              <LazyMountSection
                minHeight={360}
                className="py-6"
              >
                <Suspense fallback={<TrendingShowcaseSkeleton minHeight={360} />}>
                  <HomeTrendingShowcase
                    heading="Your Best Sellers, Trending Now"
                    subheading="Trending beauty tools curated for you"
                    priorityNames={[
                      "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
                      "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
                      "Ilika Lip Plumper Vacuum Device | For Fuller Looking Lips | Lip Enhancement, Lip Massage & Beauty Tool"
                    ]}
                    limit={4}
                  />
                </Suspense>
              </LazyMountSection>

              <LazyMountSection minHeight={120}>
                <Suspense fallback={<DividerStripSkeleton />}>
                  <HomeDivisionSttrip
                    offers={[
                      {
                        title: "Extra 15% Off",
                        subtitle: "on Voice Mask Maker Machine",
                        codeLabel: "Use Code",
                        code: "ILIKADIY",
                        to: "/product/voice-face-mask-maker",
                      },
                      {
                        title: "Extra 15% Off",
                        subtitle: "on Hair Dryer",
                        codeLabel: "Use Code",
                        code: "ILIKA15",
                        to: "/product/leafless-hair-dryer",
                      },
                      {
                        title: "Extra 15% Off",
                        subtitle: "on Airwrap",
                        codeLabel: "Use Code",
                        code: "ILIKA15",
                        to: "/product/airwrap-multi-styler-kit",
                      },
                    ]}
                  />
                </Suspense>
              </LazyMountSection>




            </>
          ) : (
            <>
              <LazyMountSection minHeight={220}>
                <Suspense fallback={<CategoryNavSkeleton />}>
                  {/* CATEGORY NAV */}
                  <CategoryNav categories={categoriesData} />
                </Suspense>
              </LazyMountSection>

              <LazyMountSection
                minHeight={360}
                className="py-6"
              >
                <Suspense fallback={<TrendingShowcaseSkeleton minHeight={360} />}>
                  <HomeTrendingShowcase
                    heading="Your Best Sellers, Trending Now"
                    subheading="Trending beauty tools curated for you"
                    priorityNames={[
                      "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin",
                      "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
                      "Ilika Lip Plumper Vacuum Device | For Fuller Looking Lips | Lip Enhancement, Lip Massage & Beauty Tool"
                    ]}
                    limit={4}
                  />
                </Suspense>
              </LazyMountSection>

              <LazyMountSection minHeight={120}>
                <Suspense fallback={<DividerStripSkeleton />}>
                  <HomeDivisionSttrip
                    offers={[
                      {
                        title: "Extra 15% Off",
                        subtitle: "on Voice Mask Maker Machine",
                        codeLabel: "Use Code",
                        code: "ILIKADIY",
                        to: "/product/voice-face-mask-maker",
                      },
                      {
                        title: "Extra 15% Off",
                        subtitle: "on Hair Dryer",
                        codeLabel: "Use Code",
                        code: "ILIKA15",
                        to: "/product/leafless-hair-dryer",
                      },
                      {
                        title: "Extra 15% Off",
                        subtitle: "on Airwrap",
                        codeLabel: "Use Code",
                        code: "ILIKA15",
                        to: "/product/airwrap-multi-styler-kit",
                      },
                    ]}
                  />
                </Suspense>
              </LazyMountSection>


            </>
          )}

          {/* HAIRCARE RANGE */}
          <LazyMountSection
            minHeight={620}
            placeholder={<ProductShelfSkeleton minHeight={620} dark showCircleRow />}
          >
            <Suspense fallback={<ProductShelfSkeleton minHeight={620} dark showCircleRow />}>


              {/* HAIR CARE */}
              <div className="relative">
                <Banner
                  className="mt-0"
                  src={hairBannerDesktop}
                  mobileSrc={hairBannerMobile}
                  linkUrl={hairBannerProductLink}
                  bannerKey="home-haircare"
                  imageFit="contain"
                  preserveFullImage
                />
                <div className="absolute inset-0 px-4 pt-4 sm:flex sm:items-center sm:justify-center sm:px-10 sm:pt-0 lg:px-20">
                  <div className="w-full max-w-[42%] text-left text-[#211816] sm:max-w-[40%] sm:translate-x-[-34%] lg:translate-x-[-40%]">
                    <p
                      className="hidden sm:block text-3xl font-bold sm:text-[3.6rem] lg:text-[4.7rem] sm:font-semibold leading-[0.95] tracking-[-0.03em]"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      Color That&apos;s
                      <br />
                      All Yours
                    </p>
                    <div className="hidden sm:block mt-5 mb-5 h-px w-24 bg-[#a88474] sm:mt-6 sm:mb-6 sm:w-32 lg:w-48" />
                    <p className="hidden sm:block max-w-[28rem] text-[11px] sm:text-base lg:text-[1.2rem] font-light leading-[1.65] text-[#6b4639]">
                      Ilika&apos;s Black Seed Hair Oil, made to fight premature greying naturally
                    </p>
                    <h2
                      className="hidden sm:block mt-4 max-w-[28rem] text-sm sm:text-lg lg:text-[1.5rem] leading-[1.55] font-normal text-[#3f2b25]"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Your shine. Ilika&apos;s formula.
                    </h2>
                  </div>
                  <div className="absolute right-4 top-5 max-w-[42%] text-right text-[#3f2b25] sm:hidden">
                    <p
                      className="text-[1.55rem] font-bold leading-[1.02] tracking-[-0.03em]"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      Color That&apos;s
                      <br />
                      All Yours
                    </p>
                    <p className="mt-3 text-[11px] font-bold leading-[1.55] text-[#6b4639]">
                      Ilika&apos;s Black Seed Hair Oil, made to fight premature greying naturally
                    </p>
                    <p
                      className="mt-2 text-[0.9rem] font-bold leading-[1.35]"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Your shine. Ilika&apos;s formula.
                    </p>
                  </div>
                </div>
              </div>


              <Carousel
                heading={"What’s Your Hair Craving Today?"}
                subheading={"Healthy, shiny hair begins with the Right Care."}
                items={HAIR_CAROUSEL_ITEMS}
                sectionClassName="bg-black pt-6 pb-6 sm:pt-6 sm:pb-6"
                containerClassName="px-4 sm:px-6"
                headingClassName="text-white"
                subheadingClassName="text-[#b65b57]"
                titleClassName="text-white/90 text-[20px] sm:text-[18px] font-semibold"
                arrowClassName="border-white/10 bg-white text-[#111] hover:bg-[#f5ede6]"
                itemWidthClassName="w-[170px] sm:w-[190px]"
                circleClassName="w-[146px] h-[146px] sm:w-[170px] sm:h-[170px]"
              />
              <div className="bg-black py-1 pb-8">
                <div className="max-w-7xl mx-auto px-4 flex mt-1 mb-4 justify-end sm:-mt-4 sm:mb-3">
                  <Link
                    to="/hair/care"
                    className="text-xs sm:text-[15px] font-semibold text-[#b65b57] underline underline-offset-4 hover:text-white transition"
                  >
                    View All
                  </Link>
                </div>

                {haircareCategory ? (
                  <div className="relative max-w-7xl mx-auto">
                    {canSlide(hairTotal) && (
                      <>
                        <button
                          onClick={() => setHairStart((prev) => prevPageStart(prev, hairTotal))}
                          className="hidden md:flex absolute left-0 lg:-left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                          aria-label="Show previous hair care products"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setHairStart((prev) => nextPageStart(prev, hairTotal))}
                          className="hidden md:flex absolute right-0 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                          aria-label="Show next hair care products"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <ProductList
                      cardVariant="home"
                      cardTheme="dark"
                      mobileScroll
                      categoryId={haircareCategory.id}
                      priorityNames={["Ilika Black Seed Hair Oil | For Premature Grey Hair & Hair Fall Control | Nourishing Scalp Care", "Ilika 10 Herbs Herbal Hair Growth Oil | For Hair Fall Control, Hair Growth & Strong Healthy Hair", "Ilika Frizz Control Hair Serum", "Ilika Keratin Repair Conditioner"]}
                      offset={isMobile ? 0 : hairStart}
                      limit={isMobile ? undefined : getVisibleCount(hairTotal)}
                    />
                  </div>
                ) : (
                  <p className="text-center text-white">
                    Loading products...
                  </p>
                )}
              </div>
            </Suspense>
          </LazyMountSection>
          <LazyMountSection minHeight={340} placeholder={<RoutineSkeleton />}>
            <Suspense fallback={<RoutineSkeleton />}>
              <MyCtmRoutine />
            </Suspense>
          </LazyMountSection>


          {/* ANTI AGING RITUAL */}
          <LazyMountSection
            minHeight={360}
            className="py-6"
            placeholder={<TrendingShowcaseSkeleton minHeight={360} />}
          >
            <Suspense fallback={<TrendingShowcaseSkeleton minHeight={360} />}>
              <HomeTrendingShowcase
                heading="The Anti-Aging Ritual"
                subheading="Curated skincare for visibly younger-looking skin"
                modelImage="/Homepage/homepageantiaging.png"
                viewAllTo="/skin"
                priorityNames={[
                  "Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow",
                  "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask",
                  "Ilika Collagen Serum",
                  "Ilika Retinol Anti-Aging Facial Oil",
                ]}
                limit={4}
              />
            </Suspense>
          </LazyMountSection>

          <LazyMountSection minHeight={120} placeholder={<DividerStripSkeleton />}>
            <Suspense fallback={<DividerStripSkeleton />}>
              <HomeDivisionSttrip
                offers={[
                  {
                    title: "Extra 15% Off",
                    subtitle: "on Voice Mask Maker Machine",
                    codeLabel: "Use Code",
                    code: "ILIKADIY",
                    to: "/product/voice-face-mask-maker",
                  },
                  {
                    title: "Extra 15% Off",
                    subtitle: "on Hair Dryer",
                    codeLabel: "Use Code",
                    code: "ILIKA15",
                    to: "/product/leafless-hair-dryer",
                  },
                  {
                    title: "Extra 15% Off",
                    subtitle: "on Airwrap",
                    codeLabel: "Use Code",
                    code: "ILIKA15",
                    to: "/product/airwrap-multi-styler-kit",
                  },
                ]}
              />
            </Suspense>
          </LazyMountSection>

          {/* APPLIANCES RANGE*/}
          <LazyMountSection
            minHeight={620}
            placeholder={<TrendingShowcaseSkeleton minHeight={620} dark />}
          >
            <Suspense fallback={<TrendingShowcaseSkeleton minHeight={620} dark />}>
              <HomeTrendingShowcase
                heading="Style Your Hair, Your Way"
                subheading="Smart hair appliances for salon-like results at home"
                modelImage="/Homepage/homepagehaircarerange.png"
                viewAllTo="/hair/styling"
                categoryId={hairstylingCategory?.id}
                theme="dark"
                priorityNames={[
                  "Ilika Airwrap Multi-Styler Kit | 5-in-1 Hair Styling Tool with Dryer, Curler & Volumizer Attachments",
                  "Ilika High-Speed BLDC Hair Dryer | Fast Drying Professional Hair Dryer with Ionic Technology & Temperature Control",
                  "Ilika 5-in-1 Professional Hair Tong Curler & Waver",
                  "Ilika Hot Air Brush | Hair Straightener Brush for Smoothing, Styling & Salon-Like Blowout at Home",
                ]}
                limit={4}
              />
            </Suspense>
          </LazyMountSection>

          {/* SKIN CARE RANGE */}
          <LazyMountSection
            minHeight={620}
            placeholder={<ProductShelfSkeleton minHeight={620} showCircleRow />}
          >
            <Suspense fallback={<ProductShelfSkeleton minHeight={620} showCircleRow />}>
              {/* <Banner
                className="mt-0 md:h-[60vh]"
                src={bannerSkincare}
                mobileSrc={skinMobile}
                linkUrl="/skin"
                bannerKey="home-skincare"
                imageFit={isMobile ? "contain" : "cover"}
              /> */}

              <Carousel
                heading={"What Does Your Skin Need Today?"}
                subheading={"Target every skin concern with personalized skincare"}
                items={SKIN_CAROUSEL_ITEMS}
                sectionClassName="bg-white pt-6 pb-6 sm:pt-6 sm:pb-6"
                containerClassName="px-4 sm:px-6"
                headingClassName="text-[#1f1a17]"
                subheadingClassName="text-[#b65b57]"
                titleClassName="text-[#1f1a17] text-[20px] sm:text-[18px] font-semibold"
                arrowClassName="border-[#e5d7cf] bg-white text-[#111] hover:bg-[#f5ede6]"
                itemWidthClassName="w-[170px] sm:w-[190px]"
                circleClassName="w-[146px] h-[146px] sm:w-[170px] sm:h-[170px]"
              />
              <div className="bg-white py-1 pb-8">
                <div className="max-w-7xl mx-auto px-4 flex mt-1 mb-1 justify-end sm:-mt-4 sm:mb-2">
                  <Link
                    to="/skin"
                    className="text-xs sm:text-[15px] font-semibold text-[#b65b57] underline underline-offset-4 hover:text-black transition"
                  >
                    View All
                  </Link>
                </div>

                {skincareCategory ? (
                  <div className="relative max-w-7xl mx-auto">
                    {canSlide(skinTotal) && (
                      <>
                        <button
                          onClick={() => setSkinStart((prev) => prevPageStart(prev, skinTotal))}
                          className="hidden md:flex absolute left-0 lg:-left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                          aria-label="Show previous skin care products"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSkinStart((prev) => nextPageStart(prev, skinTotal))}
                          className="hidden md:flex absolute right-0 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full border border-[#e7d5d5] bg-white text-[#7a1f1f] shadow-lg items-center justify-center hover:bg-[#fff5f5] transition"
                          aria-label="Show next skin care products"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <ProductList
                      cardVariant="home"
                      mobileScroll
                      priorityNames={["Ilika 24K Gold Collagen Face Mask | For Deep Hydration, Skin Firming, Anti-Aging & Instant Glow", "Ilika 4-in-1 Collagen Face Mask | Hydration, Firming, Brightening & Anti-Aging Care | Hydrogel Sheet Mask", "Ilika Voice Face Mask Maker Machine with Collagen Peptide | DIY Fresh Fruit Facial Mask Machine for Glowing Skin", "Ilika Electronic Acne Light Therapy Device | For Acne Treatment, Pimple Reduction & Clearer Looking Skin"]}
                      categoryId={skincareCategory.id}
                      offset={isMobile ? 0 : skinStart}
                      limit={isMobile ? undefined : getVisibleCount(skinTotal)}
                    />
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    Loading products...
                  </p>
                )}
              </div>
            </Suspense>
          </LazyMountSection>

          <LazyMountSection minHeight={120} placeholder={<DividerStripSkeleton />}>
            <Suspense fallback={<DividerStripSkeleton />}>
              <HomeDivisionSttrip
                offers={[
                  {
                    title: "Extra 15% Off",
                    subtitle: "on Voice Mask Maker Machine",
                    codeLabel: "Use Code",
                    code: "ILIKADIY",
                    to: "/product/voice-face-mask-maker",
                  },
                  {
                    title: "Extra 15% Off",
                    subtitle: "on Hair Dryer",
                    codeLabel: "Use Code",
                    code: "ILIKA15",
                    to: "/product/leafless-hair-dryer",
                  },
                  {
                    title: "Extra 15% Off",
                    subtitle: "on Airwrap",
                    codeLabel: "Use Code",
                    code: "ILIKA15",
                    to: "/product/airwrap-multi-styler-kit",
                  },
                ]}
              />
            </Suspense>
          </LazyMountSection>

          {homeHonestReviews.length ? (
            <LazyMountSection minHeight={520}>
              <section className="bg-white px-4 py-8 sm:px-6 sm:py-10">
                <div className="mx-auto max-w-7xl">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="min-w-0 flex-1 text-center">
                      <Heading
                        heading="Loved By Thousands"
                        sub="Real customer videos, unboxings, and first impressions from the Ilika community."
                        align="center"
                        subVariant="paragraph"
                        subClassName="!max-w-3xl !text-[#587082]"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <div
                      ref={honestReviewsScrollRef}
                      className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      style={{ WebkitOverflowScrolling: "touch" }}
                      onMouseEnter={() => {
                        honestReviewsPausedRef.current = true;
                      }}
                      onMouseLeave={() => {
                        honestReviewsPausedRef.current = false;
                      }}
                      onPointerDown={() => {
                        honestReviewsPausedRef.current = true;
                      }}
                      onPointerUp={() => {
                        honestReviewsPausedRef.current = false;
                      }}
                      onPointerCancel={() => {
                        honestReviewsPausedRef.current = false;
                      }}
                    >
                      {autoScrollHonestReviews.map((item, index) => (
                        <HomeHonestReviewCard
                          key={`${item.id}-${index}`}
                          item={item}
                          onOpen={setActiveHonestReview}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </LazyMountSection>
          ) : null}

          <LazyMountSection minHeight={420} placeholder={<LandingPagesSkeleton />}>
            <section className="bg-black px-4 py-8 sm:px-6 sm:py-10">
              <div className="mx-auto max-w-7xl">
                <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                  Product Landing Pages
                </p>

                <div className="flex gap-3 overflow-x-auto pb-2 sm:hidden scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {landingCards.map((card) => (
                    <Link
                      key={card.id}
                      to={card.linkPath}
                      className="group relative block snap-start shrink-0 w-[68vw] max-w-[230px] overflow-hidden rounded-[18px] bg-[#111111]"
                    >
                      <div className="relative aspect-[4/6] overflow-hidden">
                        <OptimizedImage
                          src={card.image}
                          alt={card.title}
                          width={900}
                          height={1350}
                          sizes="68vw"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60" />
                        <div className="absolute inset-x-0 top-0 p-3">
                          <p className="text-[10px] font-medium leading-4 text-white/90">
                            {card.eyebrow}
                          </p>
                          <h3
                            className="mt-2 max-w-[88%] text-[17px] font-semibold leading-[0.95] tracking-[-0.03em] text-white"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                          >
                            {card.title.replace(/^Explore\s+/i, "")}
                          </h3>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-white">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                            View Page
                          </span>
                          <span className="text-[13px] font-semibold">
                            Swipe &gt;
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="relative hidden sm:block">
                  {canSlideLandingDesktop ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setLandingStart((current) =>
                            current <= 0 ? maxLandingDesktopStart : current - 1
                          )
                        }
                        className="absolute left-[-16px] top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:bg-[#f3ece8] lg:inline-flex"
                        aria-label="Show previous landing pages"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLandingStart((current) =>
                            current >= maxLandingDesktopStart ? 0 : current + 1
                          )
                        }
                        className="absolute right-[-16px] top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white text-black shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:bg-[#f3ece8] lg:inline-flex"
                        aria-label="Show next landing pages"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}

                  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                    {visibleLandingCards.map((card) => (
                      <Link
                        key={card.id}
                        to={card.linkPath}
                        className="group relative block overflow-hidden rounded-[22px] bg-[#111111] sm:rounded-[28px]"
                      >
                        <div className="relative aspect-[4/5.25] overflow-hidden">
                          <OptimizedImage
                            src={card.image}
                            alt={card.title}
                            width={900}
                            height={1350}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/55" />
                          <div className="absolute inset-x-0 top-0 p-4 sm:p-5">
                            <p className="text-sm font-medium leading-6 text-white/90 sm:text-[15px]">
                              {card.eyebrow}
                            </p>
                            <h3
                              className="mt-3 max-w-[85%] text-[30px] font-semibold leading-[0.95] tracking-[-0.03em] text-white sm:text-[38px]"
                              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                              {card.title.replace(/^Explore\s+/i, "")}
                            </h3>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-white sm:p-5">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                              View Page
                            </span>
                            <span className="text-base font-semibold transition-transform duration-300 group-hover:translate-x-1">
                              Swipe &gt;
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </LazyMountSection>

          {activeHonestReview ? (
            <HomeHonestReviewLightbox
              item={activeHonestReview}
              onClose={() => setActiveHonestReview(null)}
            />
          ) : null}


          {/* MANIFESTO */}
          {/* <LazyMountSection minHeight={150}>
            <Suspense fallback={<div className="h-24" />}>
              <Menifesto />
            </Suspense>
          </LazyMountSection> */}



          {/* TRUST STRIP  */}
          <LazyMountSection
            minHeight={120}
            className="bg-[#b34140]"
            placeholder={<TrustStripSkeleton />}
          >
            <section className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
              <div className="overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4">
                  {HOME_SUPPORT_ITEMS.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className={`flex min-h-[92px] flex-col items-center justify-center px-3 py-5 text-center sm:min-h-[108px] sm:px-4 sm:py-6 ${index < HOME_SUPPORT_ITEMS.length - 1 ? "md:border-r md:border-white/25" : ""
                          } ${index % 2 === 0 ? "border-r border-white/20 md:border-r md:border-white/25" : ""} ${index < 2 ? "border-b border-white/20 md:border-b-0" : ""
                          }`}
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#d99aa1] shadow-[0_10px_24px_rgba(0,0,0,0.08)] sm:h-11 sm:w-11">
                          <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        </span>
                        <p className="mt-3 text-[12px] font-semibold leading-5 text-white sm:text-sm">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-white/80 sm:text-xs">
                          {item.subtitle}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </LazyMountSection>



          {/* TESTIMONIAL */}
          <LazyMountSection minHeight={340} placeholder={<TestimonialsSkeleton />}>
            <section className="min-h-[320px] lg:min-h-[340px] flex flex-col justify-center">
              <Heading heading="Honest Reviews" sub="Real experiences from the ilikä community" />
              <Suspense fallback={<TestimonialsSkeleton />}>
                <TestimonialList />
              </Suspense>
            </section>
          </LazyMountSection>


          {/* FOOTER */}
          <Suspense fallback={<FooterSkeleton />}>
            <Footer />
          </Suspense>
        </main>

      </div>
    </>
  );
};

export default Home;
