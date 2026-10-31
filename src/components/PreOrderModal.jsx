import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { validatePreorderDetails } from "../../Backend/services/preorderDetails.js";
import { getApiUrl } from "../utils/api";
import SuccessConfetti from "./SuccessConfetti";

export default function PreOrderModal({ isOpen, onClose, product, variant }) {
  const [details, setDetails] = useState({ name: "", phone: "", address: "", email: "", contactMethod: "address" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const pending = useRef(false);
  const nameInput = useRef(null);
  const closeButton = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    setDetails({ name: "", phone: "", address: "", email: "", contactMethod: "address" });
    setErrors({});
    setSubmitError("");
    setSubmitted(false);
    nameInput.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape" && !pending.current) onClose();
      if (event.key !== "Tab") return;
      const elements = [...dialogRef.current.querySelectorAll('button:not(:disabled), input, textarea, a[href]')];
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, onClose]);
  useEffect(() => {
    if (submitted) closeButton.current?.focus();
  }, [submitted]);
  if (!isOpen || !product) return null;
  const update = (field) => (event) => {
    setDetails((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };
  const submit = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    const result = validatePreorderDetails(details);
    setErrors(result.errors);
    if (!result.valid) return;
    pending.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch(getApiUrl("/api/preorders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.value, productId: product.docId || product.id || product._id, variantId: variant?.id || null }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success !== true) throw new Error(payload.error || "Could not save your request. Please try again.");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || "Could not save your request. Please try again.");
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };
  const inputClass = "mt-1.5 w-full rounded-xl border border-[#e6d9d3] bg-white px-3 py-3 text-base text-[#332521] outline-none focus:border-[#a6423e] focus:ring-2 focus:ring-[#a6423e]/15";
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-3 sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}>
      {submitted && <SuccessConfetti />}
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="preorder-title" className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl bg-[#fffdfa] p-5 text-[#332521] shadow-2xl sm:p-7">
        <button ref={closeButton} type="button" onClick={onClose} disabled={submitting} aria-label="Close pre-order form" className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-[#786c67] hover:bg-[#f5eeeb]"><X size={20} /></button>
        <h2 id="preorder-title" className="pr-9 text-2xl font-bold">{submitted ? "Request received" : "Pre-order your mask maker"}</h2>
        {submitted ? (
          <div role="status" className="mt-5">
            <CheckCircle2 className="h-10 w-10 text-emerald-700" />
            <p className="mt-3 text-sm leading-6">Your details have been saved. Our team will contact you about availability.</p>
            <button type="button" onClick={onClose} className="mt-5 min-h-11 w-full rounded-xl bg-[#a6423e] px-4 py-3 font-semibold text-white">Done</button>
          </div>
        ) : <>
          <p className="mt-2 text-sm leading-6 text-[#786c67]">{product.name}{variant?.label ? ` · ${variant.label}` : ""}</p>
          <p className="mt-2 text-xs leading-5 text-[#786c67]">Leave your details for a follow-up about availability. No payment is taken here.</p>
          <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
            <div>
              <label htmlFor="preorder-name" className="text-sm font-semibold">Full name <span className="text-[#a6423e]">*</span></label>
              <input ref={nameInput} id="preorder-name" name="name" autoComplete="name" required maxLength={120} value={details.name} onChange={update("name")} className={inputClass} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "preorder-name-error" : undefined} />
              {errors.name && <p id="preorder-name-error" role="alert" className="mt-1 text-xs text-red-700">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="preorder-phone" className="text-sm font-semibold">Mobile number <span className="text-[#a6423e]">*</span></label>
              <input id="preorder-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} value={details.phone} onChange={update("phone")} className={inputClass} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "preorder-phone-error" : undefined} />
              {errors.phone && <p id="preorder-phone-error" role="alert" className="mt-1 text-xs text-red-700">{errors.phone}</p>}
            </div>
            <fieldset>
              <legend className="text-sm font-semibold">Address or email <span className="font-normal text-[#786c67]">(optional)</span></legend>
              <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                {["address", "email"].map((method, index) => <React.Fragment key={method}>
                  {index > 0 && <span className="text-[11px] font-semibold text-[#786c67]">OR</span>}
                  <label className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold ${details.contactMethod === method ? "border-[#74223d] bg-[#74223d]/5 text-[#74223d]" : "border-[#e6d9d3] text-[#786c67]"}`}>
                    <input type="radio" name="contactMethod" value={method} checked={details.contactMethod === method} onChange={update("contactMethod")} className="accent-[#74223d]" />
                    {method === "address" ? "Address" : "Email"}
                  </label>
                </React.Fragment>)}
              </div>
              {details.contactMethod === "address" ? <div className="mt-2">
                <label htmlFor="preorder-address" className="text-xs font-medium text-[#786c67]">Your address</label>
                <textarea id="preorder-address" name="address" autoComplete="street-address" rows={2} maxLength={500} value={details.address} onChange={update("address")} className={inputClass} aria-invalid={Boolean(errors.address)} />
                {errors.address && <p role="alert" className="mt-1 text-xs text-red-700">{errors.address}</p>}
              </div> : <div className="mt-2">
                <label htmlFor="preorder-email" className="text-xs font-medium text-[#786c67]">Email address</label>
                <input id="preorder-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} value={details.email} onChange={update("email")} className={inputClass} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "preorder-email-error" : undefined} />
                {errors.email && <p id="preorder-email-error" role="alert" className="mt-1 text-xs text-red-700">{errors.email}</p>}
              </div>}
            </fieldset>
            {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
            <button type="submit" disabled={submitting} className="min-h-12 w-full rounded-xl bg-[#a6423e] px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? "Saving..." : "Submit pre-order request"}</button>
          </form>
        </>}
      </section>
    </div>, document.body
  );
}
