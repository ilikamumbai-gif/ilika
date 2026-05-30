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
}) => {
  const bannerCtx = useOptionalBanners();
  const matchedBanners = useMemo(() => (bannerKey && bannerCtx?.activeBanners?.length
    ? bannerCtx.activeBanners
        .filter((item) => String(item?.key || "").trim() === String(bannerKey).trim())
        .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0))
    : []), [bannerCtx?.activeBanners, bannerKey]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [bannerKey, matchedBanners.length]);

  useEffect(() => {
    if (matchedBanners.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % matchedBanners.length);
    }, Math.max(Number(autoSlideMs) || 0, 2000));
    return () => window.clearInterval(timer);
  }, [matchedBanners, autoSlideMs]);

  const matchedBanner =
    matchedBanners.length > 0
      ? matchedBanners[Math.min(activeIndex, matchedBanners.length - 1)]
      : null;

  const desktopSrc = matchedBanner?.desktopSrc || src || "/Images/Banner.webp";
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

  return (
    <section className={`w-full overflow-hidden ${className}`}>
      {resolvedLink ? (
        <a href={resolvedLink} aria-label={resolvedAlt || "Banner link"}>
          {content}
        </a>
      ) : (
        content
      )}
    </section>
  );
};

export default Banner;
