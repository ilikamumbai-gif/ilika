import React from "react";
const MiniDivider = () => {

  const saleText =
"Make Salon Quality Face Mask At Home • Use Coupon Code: ilikaDIY";

  return (
    <div className="w-full bg-black overflow-hidden">
      <div className="marquee-wrapper">
        <div className="marquee-track ">
          <span>{saleText}</span>
          <span>{saleText}</span>
          <span>{saleText}</span>
          <span>{saleText}</span> 
          <span>{saleText}</span>
        </div>
      </div>
    </div>
  );
};

export default MiniDivider;