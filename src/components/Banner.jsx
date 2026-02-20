import React from "react";
import bannerImg from "../assets/Images/Banner 2.jpg";

const Banner = ({ className = "", src }) => {
  return (
    <section className={`w-full overflow-hidden ${className}`}>
      <img
        src={src || bannerImg}
        alt="Banner"
        className="
          w-full
          h-auto
          object-contain
          md:h-full
          md:object-cover
        "
      />
    </section>
  );
};

export default Banner;