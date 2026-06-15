import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const whatsapp = "/Images/whatsapp.webp";

const EnquiryButton = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 350);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return undefined;
    setIsPopupOpen(false);
    return undefined;
  }, [pathname]);

  const openWhatsApp = () => {
    const phoneNumber = "919270114738";
    const message = "Hi, I checked your website. Can you share more details about your products and offers?";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const url = isMobile
      ? `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
    setIsPopupOpen(false);
  };

  return (
    <>
      {isPopupOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-end bg-black/10 p-3 sm:p-5 pointer-events-none">
          <div className="relative w-[calc(100vw-24px)] max-w-[340px] rounded-[22px] border border-black/10 bg-white px-4 py-5 shadow-[0_12px_35px_rgba(0,0,0,0.14)] pointer-events-auto sm:w-[300px] sm:px-5 sm:py-6">
            <h3 className="text-center font-['Playfair_Display'] text-[clamp(28px,10vw,34px)] font-bold leading-none text-black">
              Hi
            </h3>

            <p className="mx-auto mt-4 max-w-[240px] text-center font-['Lato'] text-[clamp(14px,4.2vw,16px)] font-medium leading-[1.45] text-black">
              Need help? Chat with us on WhatsApp!
            </p>

            <button
              onClick={openWhatsApp}
              className="mt-5 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-[#10b65a] px-4 font-['Lato'] text-[clamp(14px,4.4vw,17px)] font-extrabold tracking-[0.05em] text-white shadow-[0_8px_18px_rgba(16,182,90,0.22)] transition-all duration-200 hover:scale-[1.02] hover:bg-[#0da550] sm:mt-6 sm:h-[56px] sm:px-5"
            >
              <img
                src={whatsapp}
                alt=""
                className="h-6 w-6 rounded-full object-cover sm:h-8 sm:w-8"
              />

              START CHAT
            </button>

            <button
              onClick={() => setIsPopupOpen(false)}
              aria-label="Close WhatsApp popup"
              className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#10b65a] text-[30px] leading-none text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition hover:bg-[#0da550] sm:-bottom-4 sm:-right-4 sm:h-12 sm:w-12 sm:text-[34px]"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsPopupOpen(true)}
        aria-label="Open WhatsApp enquiry popup"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        className={`
          fixed right-3 z-[999]
          h-9 w-9 md:h-10 md:w-10 lg:h-11 lg:w-11
          rounded-full
          shadow-lg
          transition-all duration-300
          hover:scale-110
          active:scale-95
          cursor-pointer
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
        `}
      >
        <img
          loading="lazy"
          src={whatsapp}
          alt="WhatsApp"
          className="h-full w-full rounded-full object-cover"
        />
      </button>
    </>
  );
};

export default EnquiryButton;
