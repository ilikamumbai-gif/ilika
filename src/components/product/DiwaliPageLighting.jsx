import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./DiwaliPageLighting.css";

const getPurchaseButton = (target) => {
  const button = target instanceof Element ? target.closest("button, a, [role='button']") : null;
  return button && !button.disabled && button.getAttribute("aria-disabled") !== "true"
    && /^(buy now(?:\s*[-–]\s*.+)?|add to cart|pre[\s-]?order)$/i.test(button.textContent.trim()) ? button : null;
};

const GoldenCracker = ({ x, y, hover = false, purchase = false, onComplete }) => (
  <span className={`diwali-golden-cracker${hover ? " diwali-hover-cracker" : ""}${purchase ? " diwali-purchase-cracker" : ""}`} style={{ left: x, top: y }}
    onAnimationEnd={(event) => { if (event.target === event.currentTarget) onComplete?.(); }}>
    {purchase && <span className="diwali-purchase-halo" />}
    {Array.from({ length: purchase ? 12 : 8 }, (_, index) => (
      <span key={index} className="diwali-golden-spark" style={{ "--spark-angle": `${index * (purchase ? 30 : 45)}deg` }} />
    ))}
  </span>
);

export default function DiwaliPageLighting() {
  const [lights, setLights] = useState([]);
  const [hoverBursts, setHoverBursts] = useState([]);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const sequence = useRef(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => { setReducedMotion(preference.matches); setLights([]); setHoverBursts([]); };
    preference.addEventListener("change", updatePreference);
    if (reducedMotion) return () => preference.removeEventListener("change", updatePreference);

    const illuminate = (event) => {
      const button = getPurchaseButton(event.target);
      if (!button) {
        if (event.type !== "click" || event.detail === 0) return;
        const light = {
          id: ++sequence.current, tap: true,
          burstX: event.clientX, burstY: event.clientY,
          left: event.clientX - 65, top: event.clientY - 65, width: 130, height: 130,
        };
        setLights((current) => [...current, light].slice(-3));
        return;
      }
      const bounds = button.getBoundingClientRect();
      const light = {
        id: ++sequence.current, active: event.type === "click",
        burstX: event.detail ? event.clientX : bounds.left + bounds.width / 2,
        burstY: event.detail ? event.clientY : bounds.top + bounds.height / 2,
        left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
        borderRadius: getComputedStyle(button).borderRadius,
      };
      if (event.type === "click") document.dispatchEvent(new CustomEvent("ilika:purchase-celebration"));
      setLights((current) => [...current.filter((item) => item.left !== light.left || item.top !== light.top), light].slice(-3));
    };
    let frame = null;
    let pointerX = 0;
    let pointerY = 0;
    let lastHoverBurst = -Infinity;
    const followMouse = (event) => {
      if (event.pointerType !== "mouse") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const now = performance.now();
        if (now - lastHoverBurst >= 240) {
          lastHoverBurst = now;
          const burst = { id: ++sequence.current, x: pointerX, y: pointerY };
          setHoverBursts((current) => [...current, burst].slice(-4));
        }
      });
    };
    const stopHover = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      setHoverBursts([]);
    };
    const clearLights = () => { setLights([]); stopHover(); };
    document.addEventListener("pointermove", followMouse, { passive: true });
    document.documentElement.addEventListener("pointerleave", stopHover);
    window.addEventListener("blur", stopHover);
    document.addEventListener("focusin", illuminate);
    document.addEventListener("click", illuminate, true);
    window.addEventListener("scroll", clearLights, { passive: true, capture: true });
    window.addEventListener("resize", clearLights);
    return () => {
      stopHover();
      document.removeEventListener("pointermove", followMouse);
      document.documentElement.removeEventListener("pointerleave", stopHover);
      window.removeEventListener("blur", stopHover);
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("focusin", illuminate);
      document.removeEventListener("click", illuminate, true);
      window.removeEventListener("scroll", clearLights, true);
      window.removeEventListener("resize", clearLights);
    };
  }, [reducedMotion]);

  return createPortal(
    <div className="diwali-page-lighting" aria-hidden="true">
      <span className="diwali-edge-light diwali-edge-light-left" />
      <span className="diwali-edge-light diwali-edge-light-right" />
      {hoverBursts.map((burst) => (
        <GoldenCracker key={burst.id} x={burst.x} y={burst.y} hover
          onComplete={() => setHoverBursts((current) => current.filter((item) => item.id !== burst.id))} />
      ))}
      {lights.map(({ id, active, tap, burstX, burstY, ...style }) => (
        <React.Fragment key={id}>
        <div className={tap ? "diwali-tap-light" : `diwali-button-light${active ? " diwali-button-light-active" : ""}`} style={style}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) setLights((current) => current.filter((item) => item.id !== id));
          }}>
          {!tap && <span className="diwali-button-shimmer" />}
        </div>
        {(tap || active) && (
          <GoldenCracker x={burstX} y={burstY} purchase={active} />
        )}
        </React.Fragment>
      ))}
    </div>, document.body
  );
}
