import React from "react";
import bannerImg from "../assets/Images/Banner 2.webp";

const Banner = ({
  className = "",
  src,
  mobileSrc
}) => {
  const desktopSrc = src || bannerImg;
  const mobileImageSrc = mobileSrc || desktopSrc;

  return (
    <section className={`w-full overflow-hidden ${className}`}>
      <picture>
        <source media="(max-width: 639px)" srcSet={mobileImageSrc} />
        <img
          src={desktopSrc}
          alt="Banner"
          className="w-full h-full object-cover"
          decoding="async"
        />
      </picture>
    </section>
  );
};

export default Banner;
