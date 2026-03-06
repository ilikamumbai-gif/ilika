import React from "react";
import { Copy, Gift, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const OfferCard = ({
  type = "coupon",
  title,
  description,
  code,
  link = "/",
}) => {

  const copyCode = (e) => {
    e.preventDefault();
    if (!code) return;
    navigator.clipboard.writeText(code);
    alert(`Coupon "${code}" copied!`);
  };

  return (
    <Link
      to={link}
      state={type === "coupon" ? { scrollToCoupon: true } : {}}
      className="
      block relative
      rounded-2xl
      p-[1px]
      bg-gradient-to-r from-pink-300 via-rose-300 to-pink-400
      hover:scale-[1.02]
      transition duration-300
      group
      "
    >
      {/* CARD */}
      <div
        className="
        bg-white/90 backdrop-blur-md
        rounded-2xl
        p-4 sm:p-6
        h-full
        shadow-md
        group-hover:shadow-xl
        transition
        flex flex-col justify-between
        "
      >

        <div>
          {/* TITLE */}
          <h3 className="text-base sm:text-lg font-semibold text-[#7A2E3A] mb-2">
            {title}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
            {description}
          </p>

          {/* COUPON */}
          {type === "coupon" && (
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">

              <span
                className="
                border border-dashed border-pink-400
                px-3 py-1 rounded-md
                text-xs sm:text-sm font-semibold
                text-[#7A2E3A]
                bg-pink-50
                "
              >
                {code}
              </span>

              <button
                onClick={copyCode}
                className="
                flex items-center gap-1
                text-xs sm:text-sm font-medium
                text-[#7A2E3A]
                hover:text-pink-600
                "
              >
                <Copy size={16} />
                Copy Code
              </button>

            </div>
          )}
        </div>

        {/* CTA */}
        <div
          className="
          flex items-center justify-between
          flex-wrap gap-2
          text-[#7A2E3A]
          font-semibold
          mt-2
          "
        >

          <div className="flex items-center gap-2 text-sm sm:text-base">
            <Gift size={18} className="text-pink-500 shrink-0" />
            <span>
              {type === "coupon" ? "Special Coupon Deal" : "Special Combo Deal"}
            </span>
          </div>

          <div
            className="
              flex items-center gap-1
              text-sm sm:text-base
              group-hover:translate-x-1
              transition
            "
          >
            <span className="relative">

              {type === "coupon" ?"View Deal": "Build Your Combo" }

              <span
                className="
                absolute left-0 -bottom-1
                h-[2px]
                w-0
                bg-[#7A2E3A]
                group-hover:w-full
                transition-all duration-300
                "
              />

            </span>

            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition shrink-0"
            />

          </div>

        </div>

      </div>
    </Link>
  );
};

export default OfferCard;