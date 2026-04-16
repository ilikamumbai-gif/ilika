import React from "react";
import bannerImg from "../assets/Images/Banner 2.webp";

const Banner = ({
  className = "",
  src,
  mobileSrc
}) => {
  return (
    <section className={`w-full overflow-hidden ${className}`}>

      {/* Desktop / Tablet */}
      <img
        src={src || bannerImg}
        alt="Banner"
        className="
          hidden sm:block
          w-full
          h-full
          object-cover
        "
      />

      {/* Mobile */}
      <img
        src={mobileSrc || src || bannerImg}
        alt="Banner"
        className="
          block sm:hidden
          w-full
          h-auto
          object-contain
        "
      />

    </section>
  );
};

export default Banner;