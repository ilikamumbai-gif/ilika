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
bg-gradient-to-r from-[#e7b4b4] via-[#c55f5f] to-[#801f1f]
      hover:scale-[1.02]
      transition duration-300
      group
      "
    >
      {/* CARD */}
      <div
        className="
        secondary-bg-color
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
          <h3 className="text-base sm:text-lg font-semibold heading-color mb-2 sm:mb-2">
            {title}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-sm sm:text-sm content-text mb-3 sm:mb-4 leading-relaxed">
             {description}
          </p>

          {/* COUPON */}
          {type === "coupon" && (
            <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 mb-3 sm:mb-4">
              <span
                className="
                border border-dashed 
                px-3 py-1 rounded-md
                text-xs sm:text-sm font-semibold
                bg-[#801f1f] border-[#801f1f] text-white
                "
              >
                {code}
              </span>

              <button
                onClick={copyCode}
                className="
                flex items-center gap-1
                text-xs sm:text-sm font-medium
                text-[#801f1f] hover:text-[#c55f5f]
                self-start
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
          gap-2
heading-color
          font-semibold
          mt-2 sm:mt-2
          "
        >

          <div className="flex items-center gap-1.5 text-[15px] sm:text-base">
            <Gift size={16} className="text-[#801f1f] shrink-0" />
            <span>
              {type === "coupon" ? "Special Deal" : "Special Deal"}
            </span>
          </div>

          <div
            className="
              flex items-center gap-1
              text-[15px] sm:text-base
              group-hover:translate-x-1
              transition
              whitespace-nowrap
            "
          >
            <span className="relative">

              {type === "coupon" ? "View Deal" : "Grab Your Gift"}

              <span
                className="
                absolute left-0 -bottom-1
                h-[2px]
                w-0
                bg-[#801f1f]
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
