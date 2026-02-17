import React from "react";

const TestimonialCard = ({ testimonial }) => {
  return (
    <div
      className="
        w-[85%] sm:w-[48%] md:w-[32%] lg:w-[24%] flex-shrink-0
        primary-bg-color
        rounded-2xl
        p-5 sm:p-6
        flex flex-col gap-4
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-1
        shadow-sm
      "
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <h4 className="font-semibold text-sm heading-color">
          {testimonial.name}
        </h4>
      </div>

      {/* Text */}
      <p className="text-sm text-[#1C371C] leading-relaxed">
        {testimonial.text}
      </p>
    </div>
  );
};

export default TestimonialCard;
