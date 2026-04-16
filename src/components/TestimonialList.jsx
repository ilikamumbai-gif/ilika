import React, { useRef, useState } from "react";
import testimonials from "../Dummy/testimonials.json";
import TestimonialCard from "./TestimonialCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TestimonialList = () => {
  const sliderRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  /* ================= BUTTON SCROLL ================= */

  const scroll = (direction) => {
    const slider = sliderRef.current;
    const scrollAmount = slider.clientWidth * 0.9;

    slider.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  /* ================= DRAG START ================= */

  const handleMouseDown = (e) => {
    const slider = sliderRef.current;
    setIsDragging(true);
    slider.classList.add("cursor-grabbing");

    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
  };

  /* ================= DRAG MOVE ================= */

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const slider = sliderRef.current;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  };

  /* ================= DRAG END ================= */

  const stopDrag = () => {
    const slider = sliderRef.current;
    setIsDragging(false);
    slider.classList.remove("cursor-grabbing");
  };

  return (
    <section className="w-full py-6 primary-bg-color">
      <div className="max-w-7xl mx-auto px-4 relative">

        {/* LEFT BUTTON */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 secondary-bg-color shadow-md p-2 rounded-full hidden md:flex"
        >
          <ChevronLeft />
        </button>

        {/* RIGHT BUTTON */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 secondary-bg-color shadow-md p-2 rounded-full hidden md:flex"
        >
          <ChevronRight />
        </button>

        {/* SLIDER */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={stopDrag}
          onMouseUp={stopDrag}
          className="
            overflow-x-auto scroll-smooth scrollbar-hide
            cursor-grab
            select-none
            px-2 sm:px-4
            touch-pan-x
          "
        >
          <div className="flex gap-4 sm:gap-6">
            {testimonials.map((item) => (
              <TestimonialCard key={item.id} testimonial={item} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialList;
