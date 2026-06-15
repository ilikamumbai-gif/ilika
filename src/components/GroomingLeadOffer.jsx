import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, CheckCircle2, Copy, ExternalLink, Gift } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../utils/api";
import { useProducts } from "../admin/context/ProductContext";
import { getProductSlug } from "../utils/slugify";

const OFFER_STORAGE_KEY = "ilika.groomingOffer.unlocked";
const OFFER_DISMISS_PREFIX = "ilika.groomingOffer.dismissed";
const OFFER_NAME = "Grooming Appliances Special Offer";
const OFFER_SOURCE = "grooming_appliance_offer_popup";
const COUPON_VALUE = "₹500+";

const GROOMING_KEYWORDS = [
  "ipl",
  "laser hair removal",
  "leafless hair dryer",
  "bldc hair dryer",
  "beauty bubble",
  "blackhead remover",
  "facial cleansing brush",
  "mask maker machine",
  "voice version face mask maker",
  "high frequency therapy wand",
];

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

const normalizeCouponCode = (value = "") => String(value || "").trim().toUpperCase();

const isGroomingProduct = (product = {}) => {
  const haystack = [
    product?.name,
    product?.productUrl,
    product?.slug,
    product?.shortDescription,
    product?.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return GROOMING_KEYWORDS.some((keyword) => haystack.includes(keyword));
};

const getAssignedCoupon = (product = {}) => {
  const coupon = product?.couponSnapshot || product?.coupon || null;
  if (!coupon || coupon?.isActive === false) return null;

  const code = normalizeCouponCode(coupon?.code);
  const discountPercent = Number(coupon?.discountPercent || 0);
  const forcedPrice = Number(coupon?.forcedPrice || 0);
  if (!code || (discountPercent <= 0 && forcedPrice <= 0)) return null;

  return {
    code,
    discountPercent,
    forcedPrice: forcedPrice > 0 ? forcedPrice : null,
    isVisible: coupon?.isVisible !== false,
  };
};

const GroomingLeadOffer = ({
  pageKey = "grooming",
  showPopup = true,
  popupDelayMs = 1200,
}) => {
  const location = useLocation();
  const { currentUser, userData } = useAuth();
  const { activeProducts = [] } = useProducts();
  const [mobileNumber, setMobileNumber] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(readUnlockedState);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  const preferredMobileNumber = useMemo(() => {
    const candidate = userData?.phone || currentUser?.phoneNumber || "";
    const normalized = normalizeIndianMobile(candidate);
    return isValidIndianMobile(normalized) ? normalized : "";
  }, [currentUser, userData]);

  const revealedCoupons = useMemo(() => {
    return activeProducts
      .filter((product) => product?.isActive !== false && isGroomingProduct(product))
      .map((product) => {
        const coupon = getAssignedCoupon(product);
        if (!coupon) return null;
        return {
          productId: product?.id || product?._id || coupon.code,
          productName: product?.name || "Product",
          productLink: `/product/${getProductSlug(product)}`,
          ...coupon,
        };
      })
      .filter(Boolean);
  }, [activeProducts]);

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

  useEffect(() => {
    if (!copiedCode) return undefined;
    const timer = window.setTimeout(() => setCopiedCode(""), 1600);
    return () => window.clearTimeout(timer);
  }, [copiedCode]);

  const closeAll = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(getDismissKey(pageKey), "true");
    }
    setIsPopupOpen(false);
    setIsRevealOpen(false);
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    } catch {
      setCopiedCode(code);
    }
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
          ? "Your ₹500+ coupon is already unlocked. The available offers are revealed below."
          : "Your ₹500+ coupon is unlocked. The available offers are revealed below."
      );
      setMobileNumber(normalizedMobile);

      window.setTimeout(() => {
        setIsPopupOpen(false);
        setIsRevealOpen(true);
      }, 700);
    } catch (error) {
      setSubmitError(error?.message || "Unable to unlock the offer right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isPopupOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#f1d4df] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#111111_0%,#d15a8f_45%,#d7b46a_100%)]" />
            <button
              type="button"
              onClick={closeAll}
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
                Enter your mobile number to reveal your exclusive discount and receive the coupon.
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
      ) : null}

      {isRevealOpen ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#f1d4df] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.32)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#111111_0%,#d15a8f_45%,#d7b46a_100%)]" />
            <button
              type="button"
              onClick={closeAll}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f3dbe5] bg-white text-[#6b4256] transition hover:bg-[#fff6fa]"
              aria-label="Close revealed coupons popup"
            >
              <X size={18} />
            </button>

            <div className="px-6 pb-6 pt-7 sm:px-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#111111] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                <Gift size={14} />
                Coupon Offers Revealed
              </div>

              <h3 className="mt-4 text-2xl font-semibold leading-tight text-[#111111]">
                Your exclusive coupon codes
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5f5660]">
                Copy a coupon code below and open the product page. Hidden coupons work at checkout, and visible coupons also appear on their product pages.
              </p>

              <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {revealedCoupons.length ? revealedCoupons.map((item) => (
                  <div
                    key={`${item.productId}-${item.code}`}
                    className="rounded-2xl border border-[#f0d7e1] bg-[linear-gradient(180deg,#fff9fb_0%,#ffffff_100%)] p-4"
                  >
                    <p className="text-sm font-semibold text-[#111111]">{item.productName}</p>
                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-[#e7bfd1] bg-[#fff4f8] px-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b24074]">
                          Coupon Code
                        </p>
                        <p className="mt-1 break-all text-lg font-bold text-[#111111]">{item.code}</p>
                        <p className="mt-1 text-xs text-[#6a5c63]">
                          {item.forcedPrice
                            ? `Special price ₹${Number(item.forcedPrice).toLocaleString("en-IN")}`
                            : `${item.discountPercent}% OFF`}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-[#b24074]">
                          {item.isVisible ? "Visible on product page" : "Hidden on product page"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.code)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#111111] px-4 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        <Copy size={16} />
                        {copiedCode === item.code ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <Link
                      to={item.productLink}
                      onClick={() => setIsRevealOpen(false)}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#b24074] underline underline-offset-4"
                    >
                      Open product
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-[#f0d7e1] bg-[#fff9fb] p-4 text-sm text-[#5f5660]">
                    No grooming coupons are assigned right now. Once you assign coupons to grooming products in admin, they will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GroomingLeadOffer;
