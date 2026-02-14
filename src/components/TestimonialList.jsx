import React, { useRef, useState } from "react";
import testimonials from "../Dummy/testimonials.json";
import TestimonialCard from "./TestimonialCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TestimonialList = () => {
  const sliderRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // BUTTON SCROLL
  const scroll = (direction) => {
    const slider = sliderRef.current;
    const scrollAmount = slider.clientWidth * 0.9;

    slider.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // DRAG START
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  // DRAG MOVE
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // drag speed
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  // DRAG END
  const stopDrag = () => setIsDragging(false);

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
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10  secondary-bg-color shadow-md p-2 rounded-full hidden md:flex"
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
            overflow-x-hidden
            cursor-grab active:cursor-grabbing
            select-none
            px-4
          "
        >
          <div
            className="
            grid
            grid-rows-2
            grid-flow-col
            gap-6
            auto-cols-[90%]
            sm:auto-cols-[48%]
            lg:auto-cols-[25%]
         
            "
          >
            {testimonials.map((item) => (
              <TestimonialCard
                key={item.id}
                testimonial={item}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialList;
