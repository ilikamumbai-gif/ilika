import React from "react";
import { Quote, User } from "lucide-react";

const TestimonialCard = ({ testimonial }) => {
  return (
    <div
      className="
        w-[92%] sm:w-[48%] md:w-[38%] lg:w-[31%] xl:w-[30%] flex-shrink-0
        rounded-[22px]
        border border-[#f0e1e1]
        bg-white
        p-4 sm:p-6
        flex flex-col gap-4
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(69,39,34,0.08)]
        shadow-[0_10px_24px_rgba(69,39,34,0.04)]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff5f6] sm:h-12 sm:w-12">
            <User className="h-4.5 w-4.5 text-[#b16d74] sm:h-5 sm:w-5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-[13px] font-semibold text-[#2f2624] sm:text-[15px]">
              {testimonial.name}
            </h4>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[green] sm:text-[11px]">
              Verified Customer
            </p>
          </div>
        </div>
        <Quote className="h-5 w-5 flex-shrink-0 text-[#e7c7cb] sm:h-6 sm:w-6" />
      </div>

      <p className="text-[13px] leading-6 text-[#5f5552] sm:text-[15px] sm:leading-7">
        {testimonial.text}
      </p>
    </div>
  );
};

export default TestimonialCard;
