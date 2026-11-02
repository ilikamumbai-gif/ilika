import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import "./MaskMakerGuidePopup.css";

const DISMISSED_KEY = "ilika-mask-maker-guide-dismissed";

export default function MaskMakerGuidePopup() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem(DISMISSED_KEY)) return; } catch { /* Storage may be unavailable. */ }
    const timer = window.setTimeout(() => setOpen(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);
  const dismiss = () => {
    setOpen(false);
    try { sessionStorage.setItem(DISMISSED_KEY, "1"); } catch { /* Dismiss still works without storage. */ }
  };
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => { if (event.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  if (!open) return null;
  return <aside className="mask-guide-popup" aria-labelledby="mask-guide-popup-title">
    <button type="button" className="mask-guide-popup-close" onClick={dismiss} aria-label="Dismiss mask maker guide"><X size={18} /></button>
    <span className="mask-guide-popup-kicker"><Sparkles size={14} /> FROM THE ILIKA JOURNAL</span>
    <h2 id="mask-guide-popup-title">Meet your fresh masking ritual.</h2>
    <p>See how to make fruit masks at home with Ilika Mask Maker, and explore both models and Diwali offers.</p>
    <Link to="/blog/diy-fruit-sheet-masks-at-home" onClick={dismiss}>Visit the guide <ArrowRight size={16} /></Link>
  </aside>;
}
