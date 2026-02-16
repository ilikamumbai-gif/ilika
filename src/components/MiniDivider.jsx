import React, { useEffect, useState } from "react";
import { Tag, Sparkles, Rocket } from "lucide-react";

const messages = [
  { text: "Offer Available", icon: Tag },
  { text: "New Products", icon: Sparkles },
  { text: "Upcoming Launch", icon: Rocket },
];

const MiniDivider = () => {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(false);

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setAnimate(true);
      }, 250);

    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = messages[index].icon;

  return (
    <div className="w-full MiniDivider-bg-color overflow-hidden">
      <div
        className={`
          flex items-center justify-center gap-2
          text-center font-medium text-xs xs:text-base py-2
          transition-all duration-300
          ${animate ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
        `}
      >
        <CurrentIcon className="w-4 h-4 xs:w-5 xs:h-5" />
        <span>{messages[index].text}</span>
      </div>
    </div>
  );
};

export default MiniDivider;