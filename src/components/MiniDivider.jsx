import React from "react";
import { Link } from "react-router-dom";

const MiniDivider = () => {
  const saleText = "Make Salon Quality Face Mask At Home - Use Coupon Code: ilikaDIY";
  const productLink = "/product/ilika-automatic-voice-version-face-mask-maker-machine";

  return (
    <div className="w-full bg-[#b34140] overflow-hidden">
      <div className="marquee-wrapper">
        <div className="marquee-track ">
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

export default MiniDivider;
