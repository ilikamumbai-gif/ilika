import React from "react";
import { Link } from "react-router-dom";

export const MiniDividerStrip = () => {
  const saleText = "15% OFF on MRP - Raksha Bandhan Offer on Mask Makers & Hair Dryers";
  const productLink = "/offers";

  return (
    <div className="h-6 w-full overflow-hidden bg-[#b34140] text-[#fff7f3]">
      <div className="marquee-wrapper h-full">
        <div className="marquee-track">
          <span><Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>{saleText}</Link></span>
          <span><Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>{saleText}</Link></span>
          <span><Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>{saleText}</Link></span>
          <span><Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>{saleText}</Link></span>
          <span><Link to={productLink} style={{ color: "inherit", textDecoration: "none" }}>{saleText}</Link></span>
        </div>
      </div>
    </div>
  );
};

const MiniDivider = () => {
  return null;
};

export default MiniDivider;
