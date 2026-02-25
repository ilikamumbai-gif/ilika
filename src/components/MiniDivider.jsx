import React, { useEffect, useState } from "react";
import { Tag, Sparkles, Rocket } from "lucide-react";

// const messages = [
//   { text: "Offer Available", icon: Tag },
//   { text: "New Products", icon: Sparkles },
//   { text: "Upcoming Launch", icon: Rocket },
// ];

const MiniDivider = () => {
  const saleText =
    "🌸 HOLI SALE 🌸 UP TO 50% OFF 🎉 LIMITED TIME OFFER 🔥 SHOP NOW 🎨";

  return (
    <div className="w-full bg-[#2b2a29] overflow-hidden">
      <div className="marquee-wrapper">
        <div className="marquee-track">
          <span>{saleText}</span>
          <span>{saleText}</span> {/* duplicate for seamless loop */}
          <span>{saleText}</span> {/* duplicate for seamless loop */}
          <span>{saleText}</span> {/* duplicate for seamless loop */}
          <span>{saleText}</span> {/* duplicate for seamless loop */}
        </div>
      </div>
    </div>
  );
};

export default MiniDivider;