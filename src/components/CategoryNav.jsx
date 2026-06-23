import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Heading from "./Heading";

const CategoryNav = ({ categories = [] }) => {
  return (
    <section className="w-full py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4">
        
        <Heading heading={"Shop By Categories"} sub={"What You are Loking For ?"} />

        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-2
            lg:grid-cols-6
            gap-3 sm:gap-4
            mt-6
            place-items-center
          "
        >
          {categories.map((cat, index) => (
            <Link to={cat.link} key={index} className="w-full max-w-[168px]">

              <div className="group flex flex-col items-center cursor-pointer relative">

                {/* FREE BADGE FOR OFFER */}
                {cat.name?.toLowerCase() === "offers" && (
                  <span
                    className="
                    absolute -top-3 right-1
                    text-[10px] sm:text-xs
                    px-3 py-1
                    bg-gradient-to-r from-[#f59b90] via-[#e86d6b] to-[#db5f63]
                    text-white
                    rounded-full
                    shadow-lg
                    z-10
                    font-bold tracking-wide
                    "
                  >
                    FREE
                  </span>
                )}

                {/* Image */}
                <div
                  className="
                    w-full
                    aspect-[4/4]
                    rounded-2xl
                    overflow-hidden
                    bg-white
                    border border-[#dfdfdf]
                    relative
                    transition-all duration-300
                    group-hover:-translate-y-0.5
                    group-hover:shadow-md
                  "
                >
                  <img loading="lazy"
                    src={cat.icon}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/75 to-transparent">
                    <div className="flex items-end justify-between gap-2">
                      <p className="text-white font-semibold text-[12px] sm:text-[13px] leading-tight">
                        {cat.name}
                      </p>
                      
                    </div>
                  </div>
                </div>

              </div>

            </Link>
          ))}
        </div>

        <Link
          to="/products"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#2f2f2f] bg-[#b34140] px-5 text-base font-semibold text-white transition hover:bg-[#7b403f] hover:opacity-95 sm:mt-6"
        >
          View all products
          <ArrowRight className="w-4 h-4" />
        </Link>

      </div>
    </section>
  );
};

export default CategoryNav;
