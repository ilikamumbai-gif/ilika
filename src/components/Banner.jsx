import React from "react";
import bannerImg from "../assets/Images/Banner 2.webp";
import { useOptionalBanners } from "../admin/context/BannerContext";


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
}) => {
  const bannerCtx = useOptionalBanners();
  const matchedBanner = bannerKey && bannerCtx?.activeBanners?.length
    ? bannerCtx.activeBanners
        .filter((item) => String(item?.key || "").trim() === String(bannerKey).trim())
        .sort((a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0))[0]
    : null;

  const desktopSrc = matchedBanner?.desktopSrc || src || bannerImg;
  const mobileImageSrc = matchedBanner?.mobileSrc || mobileSrc || desktopSrc;
  const resolvedLink = matchedBanner?.linkUrl || linkUrl || "";
  const resolvedAlt = matchedBanner?.alt || alt || "Banner";

  const content = (
    <picture>
      <source media="(max-width: 639px)" srcSet={mobileImageSrc} />
      <img
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        src={desktopSrc}
        alt={resolvedAlt}
        className={`w-full h-full ${imageFit === "contain" ? "object-contain" : "object-cover"}`}
        decoding={priority ? "sync" : "async"}
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
