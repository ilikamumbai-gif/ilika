import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Check, X } from "lucide-react";
import { auth } from "../firebase/firebaseConfig";
import { getApiUrl } from "../utils/api";

const NotifyMeModal = ({ isOpen, onClose, product, variant = null }) => {
  const [contact, setContact] = useState(auth.currentUser?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setContact(auth.currentUser?.email || "");
      setError("");
      setSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen || !product || typeof document === "undefined") return null;

  const submit = async (event) => {
    event.preventDefault();
    const value = contact.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const phoneDigits = value.replace(/\D/g, "");
    const isPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
    if (!isEmail && !isPhone) {
      setError("Enter a valid email address or phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(getApiUrl("/api/notify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id || product.id,
          productName: product.name,
          variantId: variant?.id || null,
          variantName: variant?.label || variant?.name || null,
          userId: auth.currentUser?.uid || null,
          email: isEmail ? value : null,
          phone: isPhone ? value : null,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not save your request. Please try again.");
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || "Could not save your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#1c1715]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="notify-title" className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-[#fffdfa] shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#b34140] via-[#e6a18c] to-[#e9c99f]" />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-[#786c67] transition hover:bg-[#f5eeeb]"><X size={19} /></button>
        <div className="px-7 pb-7 pt-9 sm:px-9 sm:pb-9">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#f8e9e2] text-[#a74c43]"><Bell size={25} /></div>
          {submitted ? (
            <div className="py-3">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={22} /></div>
              <h2 id="notify-title" className="font-serif text-2xl font-semibold text-[#27201d]">You’re on the list</h2>
              <p className="mt-2 text-sm leading-6 text-[#786c67]">We’ll let you know as soon as {product.name} is available again.</p>
              <button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-[#a6423e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f3633]">Done</button>
            </div>
          ) : (
            <>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#aa6558]">A little heads-up</p>
              <h2 id="notify-title" className="font-serif text-[27px] font-semibold leading-tight text-[#27201d]">Be first to know</h2>
              <p className="mt-2 text-sm leading-6 text-[#786c67]">{product.name}{variant?.label ? ` · ${variant.label}` : ""} is currently away. Leave your details and we’ll let you know when it’s back.</p>
              <form onSubmit={submit} className="mt-6">
                <label htmlFor="notify-contact" className="mb-2 block text-xs font-semibold text-[#443a36]">Email or mobile number</label>
                <input id="notify-contact" autoFocus type="text" autoComplete="email" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="you@example.com or +91 98765 43210" className="w-full rounded-xl border border-[#e6d9d3] bg-white px-4 py-3.5 text-sm text-[#27201d] outline-none transition placeholder:text-[#b2a6a0] focus:border-[#b87161] focus:ring-4 focus:ring-[#b87161]/10" />
                {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
                <p className="mt-3 text-[11px] leading-5 text-[#958781]">We’ll only use this to send your back-in-stock update.</p>
                <button disabled={loading} type="submit" className="mt-5 w-full rounded-xl bg-[#a6423e] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(166,66,62,0.2)] transition hover:bg-[#8f3633] disabled:cursor-wait disabled:opacity-65">{loading ? "Saving your request…" : "Notify me when it’s back"}</button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
};

export default NotifyMeModal;
