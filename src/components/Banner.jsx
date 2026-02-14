import React from "react";
import bannerImg from "../assets/Images/Banner 2.jpg";

const Banner = ({ className = "" }) => {
  return (
    <section className={`w-full ${className}`}>
      <img
        src={bannerImg}
        alt="Banner"
        className="w-full h-full object-cover"
      />
    </section>
  );
};

export default Banner;
