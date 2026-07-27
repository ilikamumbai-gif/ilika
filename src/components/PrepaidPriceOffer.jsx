import React from "react";

export const PREPAID_ORDER_DISCOUNT = 100;

const PrepaidPriceOffer = ({ price, className = "" }) => {
  const regularPrice = Number(price || 0);
  if (regularPrice <= 0) return null;

  const prepaidPrice = Math.max(0, regularPrice - PREPAID_ORDER_DISCOUNT);

  return (
    <p className={`font-semibold text-[#0a8f45] ${className}`.trim()}>
      ₹{PREPAID_ORDER_DISCOUNT} off on prepaid orders · Pay ₹{prepaidPrice.toLocaleString("en-IN")}
    </p>
  );
};

export default PrepaidPriceOffer;
