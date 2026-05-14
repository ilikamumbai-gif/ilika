import React, { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Heading from "./Heading";

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const Carousel = ({
  heading = "What Are You Looking For Today?",
  subheading ="this is demo",
  items = [],
}) => {
  const trackRef = useRef(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });
  const [isDragging, setIsDragging] = useState(false);

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

  const onPointerDown = (e) => {
    const node = trackRef.current;
    if (!node) return;
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = node.scrollLeft;
    dragRef.current.moved = false;
    setIsDragging(true);
    node.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const node = trackRef.current;
    if (!node || !dragRef.current.active) return;
    const deltaX = e.clientX - dragRef.current.startX;
    if (Math.abs(deltaX) > 4) dragRef.current.moved = true;
    node.scrollLeft = clamp(
      dragRef.current.startScrollLeft - deltaX,
      0,
      node.scrollWidth - node.clientWidth
    );
  };

  const endDrag = (e) => {
    const node = trackRef.current;
    if (!node) return;
    dragRef.current.active = false;
    setIsDragging(false);
    if (e?.pointerId !== undefined) node.releasePointerCapture?.(e.pointerId);
  };

  return (
    <section className="w-full bg-white pt-10 sm:py-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <Heading heading={heading} sub={subheading}/>

        <div className="relative">
          {/* Left Arrow */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByAmount(-1)}
            className="hidden md:flex absolute -left-5 top-[40%] -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-[#e0e0e0] bg-white shadow-sm items-center justify-center hover:bg-gray-50 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            className={`flex gap-6 sm:gap-8 overflow-x-auto pb-2 scrollbar-hide ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ touchAction: "pan-y" }}
          >
            {normalizedItems.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                draggable={false}
                onClick={(e) => {
                  if (dragRef.current.moved) e.preventDefault();
                }}
                className="relative shrink-0 flex flex-col items-center group"
                style={{ width: "140px" }}
              >
                {/* Badge */}
                {item.badge ? (
                  <span className="absolute top-1 right-1 z-10 text-[10px] px-2 py-0.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#f59b90] via-[#e86d6b] to-[#db5f63] shadow">
                    {item.badge}
                  </span>
                ) : null}

                {/* Circular Image */}
                <div
                  className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full overflow-hidden transition-transform duration-200 group-hover:scale-105"
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
                <p className="mt-3 text-center font-semibold text-[#1a1a1a] text-[13px] sm:text-[14px] leading-snug px-1">
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
            className="hidden md:flex absolute -right-5 top-[40%] -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-[#e0e0e0] bg-white shadow-sm items-center justify-center hover:bg-gray-50 transition"
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

      </div>
    </section>
  );
};

export default Carousel;