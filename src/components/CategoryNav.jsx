import React from "react";
import { Link } from "react-router-dom";

const CategoryNav = ({ categories = [] }) => {
  return (
    <section className="w-full primary-bg-color py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">

        <div
          className="
            grid
            grid-cols-[repeat(auto-fit,minmax(90px,1fr))]
            sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]
            gap-6 sm:gap-8
            place-items-center
          "
        >
          {categories.map((cat, index) => (
            <Link to={cat.link}>
              <div
              key={index}
              className="group flex flex-col items-center cursor-pointer"
            >
              {/* Image */}
              <div
                className="
                  w-16 h-16
                  sm:w-20 sm:h-20
                  md:w-24 md:h-24
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
                  text-xs sm:text-sm
                  md:text-base
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
