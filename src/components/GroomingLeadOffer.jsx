import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, CheckCircle2, Gift } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";

const OFFER_STORAGE_KEY = "ilika.groomingOffer.unlocked";
const OFFER_DISMISS_PREFIX = "ilika.groomingOffer.dismissed";
const OFFER_NAME = "Grooming Appliances Special Offer";
const OFFER_SOURCE = "grooming_appliance_offer_popup";
const COUPON_VALUE = "₹500+";

const normalizeIndianMobile = (value = "") => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
};

const isValidIndianMobile = (value = "") => /^[6-9]\d{9}$/.test(value);

const getDismissKey = (pageKey = "default") => `${OFFER_DISMISS_PREFIX}.${pageKey}`;

const readUnlockedState = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(OFFER_STORAGE_KEY) === "true";
};

const markUnlockedState = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OFFER_STORAGE_KEY, "true");
};

const GroomingLeadOffer = ({
  pageKey = "grooming",
  showPopup = true,
  popupDelayMs = 1200,
}) => {
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(readUnlockedState);

  const preferredMobileNumber = useMemo(() => {
    const candidate = userData?.phone || currentUser?.phoneNumber || "";
    const normalized = normalizeIndianMobile(candidate);
    return isValidIndianMobile(normalized) ? normalized : "";
  }, [currentUser, userData]);

  useEffect(() => {
    if (!preferredMobileNumber) return;
    setMobileNumber((current) => (current ? current : preferredMobileNumber));
  }, [preferredMobileNumber]);

  useEffect(() => {
    if (!showPopup || isUnlocked || typeof window === "undefined") return undefined;
    const dismissKey = getDismissKey(pageKey);
    if (window.sessionStorage.getItem(dismissKey) === "true") return undefined;

    const timer = window.setTimeout(() => {
      setIsPopupOpen(true);
    }, popupDelayMs);

    return () => window.clearTimeout(timer);
  }, [isUnlocked, pageKey, popupDelayMs, showPopup]);

  const closePopup = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(getDismissKey(pageKey), "true");
    }
    setIsPopupOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedMobile = normalizeIndianMobile(mobileNumber);

    if (!isValidIndianMobile(normalizedMobile)) {
      setSubmitError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      setSubmitMessage("");

      const response = await fetch(getApiUrl("/api/leads"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobileNumber: normalizedMobile,
          source: OFFER_SOURCE,
          offerName: OFFER_NAME,
          couponValue: COUPON_VALUE,
          pageUrl: typeof window !== "undefined"
            ? window.location.href
            : `${location.pathname}${location.search}${location.hash}`,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to unlock the offer right now.");
      }

      markUnlockedState();
      setIsUnlocked(true);
      setSubmitMessage(
        payload?.duplicate
          ? "Your ₹500+ coupon is already unlocked. We will send the offer details on WhatsApp."
          : "Your ₹500+ coupon is unlocked. We will send the offer details on WhatsApp."
      );
      setMobileNumber(normalizedMobile);

      window.setTimeout(() => {
        setIsPopupOpen(false);
      }, 1200);
    } catch (error) {
      setSubmitError(error?.message || "Unable to unlock the offer right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPopupOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#f1d4df] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.28)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#111111_0%,#d15a8f_45%,#d7b46a_100%)]" />
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f3dbe5] bg-white text-[#6b4256] transition hover:bg-[#fff6fa]"
          aria-label="Close offer popup"
        >
          <X size={18} />
        </button>

        <div className="px-6 pb-7 pt-7 sm:px-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1f6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b24074]">
            <Gift size={14} />
            Exclusive Offer
          </div>

          <h2 className="mt-4 text-[28px] font-semibold leading-tight text-[#111111]">
            Unlock ₹500+ OFF on Premium Grooming Appliances
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#5f5660]">
            Enter your mobile number to reveal your exclusive discount and receive the coupon on WhatsApp.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor={`grooming-offer-mobile-${pageKey}`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#6b4256]">
                Mobile Number
              </label>
              <input
                id={`grooming-offer-mobile-${pageKey}`}
                name="tel"
                type="tel"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value);
                  setSubmitError("");
                }}
                placeholder="+91 98765 43210"
                inputMode="tel"
                autoComplete="tel-national"
                enterKeyHint="done"
                className="h-12 w-full rounded-2xl border border-[#ead5de] px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#b1a0aa] focus:border-[#d15a8f] focus:ring-2 focus:ring-[#f9d7e6]"
              />
              <p className="mt-2 text-xs text-[#8b7f86]">
                {preferredMobileNumber
                  ? "We auto-filled your saved mobile number. You can claim the coupon with one click."
                  : "If your browser has a saved mobile number, it can autofill this field automatically."}
              </p>
            </div>

            {submitError ? (
              <p className="text-sm font-medium text-[#c24163]">{submitError}</p>
            ) : null}

            {submitMessage ? (
              <div className="rounded-2xl border border-[#d6f1de] bg-[#f2fbf5] px-4 py-3 text-sm font-medium text-[#1d7a46]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span>{submitMessage}</span>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#111111_0%,#d15a8f_55%,#d7b46a_100%)] px-5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Claiming..." : "Claim My Coupon"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroomingLeadOffer;
