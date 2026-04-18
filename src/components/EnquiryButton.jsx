import React, { useEffect, useState } from "react";

const whatsapp = "/Images/whatsapp.webp";

const EnquiryButton = () => {
    
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 350);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const openWhatsApp = () => {
    const phoneNumber = "919270114738";

    const message = "Hi, I checked your website. Can you share more details about your products and offers?";

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const url = isMobile
      ? `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  return (
    <button
      onClick={openWhatsApp}
      aria-label="Chat on WhatsApp"
      className={`
        fixed bottom-6 left-5 z-[999]
        w-12 h-12
        rounded-full
        shadow-lg
        transition-all duration-300
        hover:scale-110
        active:scale-95
        cursor-pointer
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
      `}
    >
      <img loading="lazy"
        src={whatsapp}
        alt="WhatsApp"
        className="w-full h-full object-cover rounded-full"
      />
    </button>
  );
};

export default EnquiryButton;