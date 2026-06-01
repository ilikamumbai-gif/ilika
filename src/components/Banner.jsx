import React, { useEffect, useMemo, useState } from "react";
import { useOptionalBanners } from "../admin/context/BannerContext";
import OptimizedImage from "./OptimizedImage";


// 3. Keys currently wired
// You already connected these:

// home-top
// home-skincare
// home-appliances
// home-haircare
// new-arrival-top
// combos-top
// coupon-builder-top


const Banner = ({
  className = "",
  src,
  mobileSrc,
  linkUrl = "",
  bannerKey = "",
  alt = "Banner",
  imageFit = "cover",
  priority = false,
  width = 1920,
  height = 760,
  autoSlideMs = 4500,
  showControls = false,
  slides = [],
}) => {
  const bannerCtx = useOptionalBanners();
  const matchedBanners = useMemo(() => (bannerKey && bannerCtx?.activeBanners?.length
    ? bannerCtx.activeBanners
        .filter((item) => String(item?.key || "").trim() === String(bannerKey).trim())
        .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0))
    : []), [bannerCtx?.activeBanners, bannerKey]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const normalizedSlides = useMemo(
    () =>
      Array.isArray(slides)
        ? slides.filter((item) => item && (item.src || item.desktopSrc || item.mobileSrc))
        : [],
    [slides]
  );
  const activeSlides = normalizedSlides.length > 0 ? normalizedSlides : matchedBanners;

  useEffect(() => {
    setActiveIndex(0);
  }, [bannerKey, activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeSlides.length);
    }, Math.max(Number(autoSlideMs) || 0, 2000));
    return () => window.clearInterval(timer);
  }, [activeSlides.length, autoSlideMs]);

  const matchedBanner =
    activeSlides.length > 0
      ? activeSlides[Math.min(activeIndex, activeSlides.length - 1)]
      : null;
  const hasMultiple = activeSlides.length > 1;

  const goNext = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const goPrev = () => {
    if (!hasMultiple) return;
    setActiveIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const desktopSrc = matchedBanner?.desktopSrc || matchedBanner?.src || src || "/Images/Banner.webp";
  const mobileImageSrc = matchedBanner?.mobileSrc || mobileSrc || desktopSrc;
  const resolvedLink = matchedBanner?.linkUrl || linkUrl || "";
  const resolvedAlt = matchedBanner?.alt || alt || "Banner";

  const content = (
    <picture>
      <source media="(max-width: 639px)" srcSet={mobileImageSrc} />
      <OptimizedImage
        priority={priority && activeIndex === 0}
        src={desktopSrc}
        alt={resolvedAlt}
        className={`w-full h-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
        sizes="100vw"
        width={width}
        height={height}
      />
    </picture>
  );

  useEffect(() => {
    if (activeSlides.length <= 1) {
      setIsTransitioning(false);
      return undefined;
    }
    setIsTransitioning(true);
    const t = window.setTimeout(() => setIsTransitioning(false), 500);
    return () => window.clearTimeout(t);
  }, [activeIndex, activeSlides.length]);

  return (
    <section className={`relative w-full overflow-hidden ${className}`}>
      <div
        className={`transition-all duration-500 ease-in-out ${
          isTransitioning ? "opacity-95" : "opacity-100"
        }`}
      >
        {resolvedLink ? (
          <a href={resolvedLink} aria-label={resolvedAlt || "Banner link"}>
            {content}
          </a>
        ) : (
          content
        )}
      </div>

      {showControls && hasMultiple ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous banner"
            className="absolute left-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-sm text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95 sm:left-4 sm:h-10 sm:w-10 sm:text-base"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next banner"
            className="absolute right-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-sm text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95 sm:right-4 sm:h-10 sm:w-10 sm:text-base"
          >
            &#8250;
          </button>
        </>
      ) : null}
    </section>
  );
};

export default Banner;
