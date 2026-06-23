import React, { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Heading from "./Heading";

const Carousel = ({
  heading = "What Are You Looking For Today?",
  subheading = "this is demo",
  items = [],
  sectionClassName = "bg-white",
  containerClassName = "",
  headingClassName = "",
  subheadingClassName = "",
  titleClassName = "",
  arrowClassName = "",
  itemWidthClassName = "w-[140px]",
  circleClassName = "w-[120px] h-[120px] sm:w-[140px] sm:h-[140px]",
}) => {
  const trackRef = useRef(null);

  const normalizedItems = useMemo(
    () =>
      items.map((item, index) => ({
        id: item.id || `${item.title || item.name}-${index}`,
        title: item.title || item.name || "Category",
        image: item.image || item.icon || "",
        link: item.link || "/",
        badge: item.badge || "",
        bgColor: item.bgColor || "",
      })),
    [items]
  );

  const scrollByAmount = (direction = 1) => {
    const node = trackRef.current;
    if (!node) return;
    const amount = Math.round(node.clientWidth * 0.72) * direction;
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className={`w-full pt-10 sm:py-10 ${sectionClassName}`}>
      <div className={`max-w-7xl mx-auto px-6 ${containerClassName}`}>
        {/* Heading */}
        <Heading
          heading={heading}
          sub={subheading}
          headingClassName={headingClassName}
          subClassName={subheadingClassName}
        />

        <div className="relative">
          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByAmount(-1)}
            className={`hidden md:flex absolute -left-5 top-[40%] -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-[#e0e0e0] bg-white shadow-sm items-center justify-center hover:bg-gray-50 transition ${arrowClassName}`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            className="flex gap-6 sm:gap-8 overflow-x-auto pb-2 scrollbar-hide"
            style={{ touchAction: "auto" }}
          >
            {normalizedItems.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                draggable={false}
                className={`relative shrink-0 flex flex-col items-center group ${itemWidthClassName}`}
              >
                {/* Badge */}
                {item.badge ? (
                  <span className="absolute top-1 right-1 z-10 text-[10px] px-2 py-0.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#f59b90] via-[#e86d6b] to-[#db5f63] shadow">
                    {item.badge}
                  </span>
                ) : null}

                {/* Circular Image */}
                <div
                  className={`${circleClassName} rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105`}
                  style={{
                    background: item.bgColor || "#e8f5f1",
                  }}
                >
                  <img
                    loading="lazy"
                    src={item.image}
                    alt={item.title}
                    draggable={false}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Title */}
                <p className={`mt-3 text-center font-semibold text-[#1a1a1a] text-[13px] sm:text-[14px] leading-snug px-1 ${titleClassName}`}>
                  {item.title}
                </p>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByAmount(1)}
            className={`hidden md:flex absolute -right-5 top-[40%] -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-[#e0e0e0] bg-white shadow-sm items-center justify-center hover:bg-gray-50 transition ${arrowClassName}`}
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Carousel;
