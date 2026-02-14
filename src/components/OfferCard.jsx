import React from "react";
import { Copy } from "lucide-react";

const OfferCard = ({ title, description, code, validity }) => {
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    alert(`Coupon "${code}" copied!`);
  };

  return (
    <div className="relative bg-white border-2 border-dashed border-[#E7A6A1] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition">

      {/* CUT EFFECT */}
      <span className="absolute -left-3 top-1/2 w-6 h-6 bg-[#fff5ef] rounded-full -translate-y-1/2" />
      <span className="absolute -right-3 top-1/2 w-6 h-6 bg-[#fff5ef] rounded-full -translate-y-1/2" />

      {/* CONTENT */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold heading-color">
          {title}
        </h3>

        <p className="text-sm content-text">
          {description}
        </p>

        <p className="text-xs text-gray-500">
          Valid till: {validity}
        </p>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between mt-4">
        <div className="border border-dashed border-gray-400 rounded-md px-3 py-1 text-sm font-medium">
          {code}
        </div>

        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-sm text-[#E7A6A1] hover:underline"
        >
          <Copy size={14} />
          Copy
        </button>
      </div>
    </div>
  );
};

export default OfferCard;
