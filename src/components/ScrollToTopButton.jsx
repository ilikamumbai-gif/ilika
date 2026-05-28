import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 350);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      className={`
        fixed left-3 z-[999]
        h-9 w-9 md:h-10 md:w-10 lg:h-11 lg:w-11
        rounded-full
        bg-[#E7A6A1] text-white
        flex items-center justify-center
        shadow-lg
        transition-all duration-300
        hover:scale-110 hover:bg-gray-900
        active:scale-95
        cursor-pointer
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
      `}
    >
      <ArrowUp className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" />
    </button>
  );
};

export default ScrollToTopButton;
