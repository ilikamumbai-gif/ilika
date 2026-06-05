import React from "react";
import { Link } from "react-router-dom";

export const MiniDividerStrip = () => {
  const saleText = "Make Salon Quality Face Mask At Home - Use Coupon Code: ilikaDIY";
  const productLink = "/product/ilika-automatic-voice-version-face-mask-maker-machine-with-collagen-peptide";

  return (
    <div className="h-6 w-full overflow-hidden bg-[#e63946]">
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
