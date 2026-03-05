import React from "react";
import { Copy, Gift } from "lucide-react";
import { Link } from "react-router-dom";

const OfferCard = ({
  type = "coupon",
  title,
  description,
  code,
  link = "/",
}) => {

  const copyCode = (e) => {
    e.preventDefault(); // prevent navigation when copying
    if (!code) return;
    navigator.clipboard.writeText(code);
    alert(`Coupon "${code}" copied!`);
  };

  return (

    <Link
      to={link}
      className="block relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition p-6 overflow-hidden"
    >

      {/* LEFT BRAND STRIP */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#1C371C]" />

      {/* CONTENT */}
      <div className="ml-3">

        <h3 className="text-lg font-semibold text-[#1C371C] mb-2">
          {title}
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          {description}
        </p>

        {/* COUPON TYPE */}
        {type === "coupon" && (
          <div className="flex items-center justify-between">

            <span className="border border-dashed border-[#1C371C] px-3 py-1 rounded-md text-sm font-semibold text-[#1C371C]">
              {code}
            </span>

            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-sm text-[#1C371C] font-medium hover:underline"
            >
              <Copy size={16} />
              Copy Code
            </button>

          </div>
        )}

        {/* DEAL TYPE */}
        {type === "deal" && (
          <div className="flex items-center gap-2 text-[#1C371C] font-medium">

            <Gift size={18} />
            <span>View Offer</span>

          </div>
        )}

      </div>

    </Link>
  );
};

export default OfferCard;