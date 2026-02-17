import React from "react";
import bannerImg from "../assets/Images/Banner 2.jpg";

const Banner = ({ className = "" }) => {
  return (
    <section className={`w-full overflow-hidden ${className}`}>
      <div
        className="
          w-full
          h-[180px]          /* mobile */
          sm:h-[250px]       /* small tablets */
          md:h-[350px]       /* tablets */
          lg:h-[450px]       /* laptops */
          xl:h-[550px]       /* large screens */
        "
      >
        <img
          src={bannerImg}
          alt="Banner"
          className="w-full h-full object-cover object-center"
        />
      </div>
    </section>
  );
};

export default Banner;
