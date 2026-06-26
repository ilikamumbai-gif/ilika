import React from "react";
import { Link } from "react-router-dom";
import Heading from "./Heading";

const CategoryNav = ({ categories = [] }) => {
  return (
    <section className="w-full bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <Heading
          heading={"Shop By Categories"}
          sub={"Explore the collection"}
          subClassName="text-[#9a8c84] tracking-[0.35em]"
          headingClassName=" font-black uppercase tracking-tight "
        />

        <div className="mt-4 grid grid-cols-2 gap-4 sm:mt-6 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
          {categories.map((cat, index) => (
            <Link to={cat.link} key={index} className="block w-full">
              <article className="group relative overflow-hidden bg-[#f7f1ee]">
                {cat.name?.toLowerCase() === "offers" && (
                  <span
                    className="absolute right-3 top-3 z-20 rounded-full bg-[#b34140] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-md sm:right-4 sm:top-4"
                  >
                    FREE
                  </span>
                )}
                <div
                  className="relative aspect-[4/5] overflow-hidden bg-[#efe8e4] sm:aspect-[5/7]"
                >
                  <img
                    loading="lazy"
                    src={cat.icon}
                    alt={cat.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-5 sm:pb-6">
                    <span className="inline-block text-left text-lg font-extrabold leading-none text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.35)] transition duration-300 group-hover:translate-y-[-2px] sm:text-[1.9rem]">
                      {cat.name}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryNav;
