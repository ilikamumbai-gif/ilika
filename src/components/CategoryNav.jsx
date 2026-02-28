import React from "react";
import { Link } from "react-router-dom";

const CategoryNav = ({ categories = [] }) => {
  return (
    <section className="w-full primary-bg-color py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">

        <div
          className="
            grid
            grid-cols-[repeat(auto-fit,minmax(100px,1fr))]
            sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]
            gap-6 sm:gap-8
            place-items-center
          "
        >
          {categories.map((cat, index) => (
            <Link to={cat.link} key={index}>
              
              <div className="group flex flex-col items-center cursor-pointer">

                {/* Image */}
                <div
                  className="
                    w-26 h-26
                    sm:w-24 sm:h-24
                    md:w-28 md:h-28
                    rounded-xl
                    overflow-hidden
                    bg-white
                    flex items-center justify-center
                    transition-all duration-300
                    group-hover:scale-105
                    group-hover:shadow-lg
                  "
                >
                  <img
                    src={cat.icon}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Text */}
                <p
                  className="
                    mt-2 sm:mt-3
                    text-sm sm:text-base
                    font-semibold
                    text-center
                    heading-2-color
                    transition-all duration-300
                    group-hover:tracking-wide
                  "
                >
                  {cat.name}
                </p>

              </div>

            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CategoryNav;