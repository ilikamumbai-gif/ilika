import React, { useEffect, useState } from "react";
import "./SuccessConfetti.css";

const colors = ["#e7bd69", "#74223d", "#f2d59b", "#d87591", "#3a9c83"];

export default function SuccessConfetti() {
  const [active, setActive] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { if (preference.matches) setActive(false); };
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  if (!active) return null;
  return (
    <div className="preorder-success-confetti" aria-hidden="true"
      onAnimationEnd={(event) => { if (event.target === event.currentTarget) setActive(false); }}>
      {Array.from({ length: 32 }, (_, index) => {
        const spread = Math.cos(index / 32 * Math.PI * 2) * (22 + index % 4 * 7);
        return <span key={index} className="preorder-confetti-piece" style={{
          backgroundColor: colors[index % colors.length],
          "--confetti-x": `${spread}vw`,
          "--confetti-end-x": `${spread * 1.15}vw`,
          "--confetti-rise": `${-18 - index % 5 * 4}vh`,
          "--confetti-spin": `${index % 2 ? 720 : -720}deg`,
          animationDelay: `${index % 6 * 45}ms`,
          borderRadius: index % 3 === 0 ? "50%" : "2px",
        }} />;
      })}
    </div>
  );
}
