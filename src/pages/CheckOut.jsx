import React, { useState, useEffect, useMemo, useRef } from "react";
import { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } from "../utils/pixel";
import { trackGtmBeginCheckout, savePendingGtmPurchase } from "../utils/gtm";
import { trackVisitorEvent } from "../utils/visitorAnalytics";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier, signOut } from "firebase/auth";
import { auth, firebaseConfig } from "../firebase/firebaseConfig";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartProvider";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CartDrawer from "../components/CartDrawer";
import Heading from "../components/Heading";
import {
  getCartItemDisplayImage,
  getCartItemDisplayPricing,
  getCartItemVariantName,
} from "../utils/productPricing";

const PREFERRED_PAYMENT_METHOD_KEY = "ilika_preferred_payment_method";

// ─── OTP WIDGET - defined OUTSIDE Checkout so it never re-mounts on re-render ─
// If defined inside the parent component, React treats it as a new component
// type on every render and unmounts/remounts it, destroying all input state.
const OtpWidget = ({
  phone,
  setPhone,
  otpSent,
  otp,
  setOtp,
  otpSending,
  verifying,
  resendCooldown,
  sendOtp,
  verifyOtp,
  onResend,
  resendCount,
  maxResendCount,
  phoneChangedSinceOtp,
}) => (
  <div className="border p-4 rounded-xl mt-3 bg-gray-50">
    <p className="text-sm mb-2 text-gray-700">
      Verify your phone number
      <span className="ml-1 text-xs text-gray-500">(you can edit)</span>
    </p>
    <input
      type="text"
      value={phone}
      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
      placeholder="Enter 10-digit phone number"
      className="border p-3 rounded-lg w-full text-sm"
      maxLength={10}
      inputMode="numeric"
    />
    <p className="text-xs text-gray-500 mt-2">
      OTP resends used: {resendCount}/{maxResendCount}
    </p>

    {!otpSent ? (
      <button
        onClick={() => sendOtp(phone)}
        disabled={otpSending || resendCooldown > 0}
        className="bg-[#E7A6A1] p-2 rounded w-full disabled:opacity-30 text-sm font-medium"
      >
        {otpSending ? "Sending OTP…" : "Send OTP"}
      </button>
    ) : (
      <>
        <input
          placeholder="Enter 6-digit OTP"
          className="border p-3 rounded-lg mt-2 w-full text-sm"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={verifyOtp}
            disabled={verifying || otp.length < 4 || phoneChangedSinceOtp}
            className="bg-black text-white p-2 rounded flex-1 disabled:opacity-50 text-sm font-medium"
          >
            {verifying ? "Verifying…" : "Verify OTP"}
          </button>
          <button
            onClick={onResend}
            disabled={otpSending || resendCooldown > 0 || resendCount >= maxResendCount}
            className="bg-gray-200 p-2 rounded text-sm px-4 disabled:opacity-50"
          >
            Resend
          </button>
        </div>
        {resendCooldown > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Please wait {resendCooldown}s before requesting another OTP.
          </p>
        )}
        {resendCount >= maxResendCount && (
          <p className="text-xs text-rose-600 mt-2">
            You reached the maximum 3 OTP resends for this session.
          </p>
        )}
        {phoneChangedSinceOtp && (
          <p className="text-xs text-rose-600 mt-2">
            Phone changed. Please send OTP again for this number.
          </p>
        )}
      </>
    )}
  </div>
);

const normalizeIndianPhone = (phone = "") =>
  String(phone).replace(/\D/g, "").slice(-10);
const normalizeCouponCode = (value = "") =>
  String(value || "").trim().toUpperCase();
const sanitizeCouponData = (coupon) => {
  if (!coupon) return null;

  const code = normalizeCouponCode(coupon?.code);
  const discountPercent = Number(coupon?.discountPercent || 0);
  const forcedPrice = Number(coupon?.forcedPrice || 0);
  const hasDiscount = discountPercent > 0;
  const hasForcedPrice = forcedPrice > 0;

  if (!code || (!hasDiscount && !hasForcedPrice)) return null;

  return {
    id: String(coupon?.id || "").trim(),
    code,
    discountPercent,
    forcedPrice: hasForcedPrice ? forcedPrice : null,
    isActive: coupon?.isActive !== false,
    isVisible: coupon?.isVisible !== false,
  };
};
const guestAddressStorageKey = "guest_checkout_addresses";
const guestVerifiedPhonesStorageKey = "guest_verified_phones";
const GIFT_WRAP_FEE = 99;

const getAddonPrice = (item = {}) => {
  const selectedAddOnPrice = Number(item?.selectedAddOn?.price || 0);
  return Number.isFinite(selectedAddOnPrice) && selectedAddOnPrice > 0 ? selectedAddOnPrice : 0;
};

const getEligibleCouponForCheckoutItem = (item = {}, liveCouponMap = {}) => {
  const couponId = String(item?.couponId || item?.couponSnapshot?.id || item?.coupon?.id || "").trim();
  const snapshot = liveCouponMap[couponId] || sanitizeCouponData(item?.couponSnapshot) || sanitizeCouponData(item?.coupon) || null;
  if (!snapshot) return null;

  const code = normalizeCouponCode(snapshot?.code);
  const discountPercent = Number(snapshot?.discountPercent || 0);
  const forcedPrice = Number(snapshot?.forcedPrice || 0);
  const normalizedName = String(item?.name || "").toLowerCase();
  const isVoiceMaskMakerProduct = normalizedName.includes("automatic voice version face mask maker machine");
  const fallbackForcedPrice =
    isVoiceMaskMakerProduct && code.toLowerCase() === "ilikadiy" ? 3999 : 0;
  const resolvedForcedPrice = forcedPrice > 0 ? forcedPrice : fallbackForcedPrice;
  const hasDiscount = discountPercent > 0;
  const hasForcedPrice = resolvedForcedPrice > 0;

  if (!code || snapshot?.isActive === false || (!hasDiscount && !hasForcedPrice)) {
    return null;
  }

  return {
    code,
    discountPercent,
    forcedPrice: hasForcedPrice ? resolvedForcedPrice : null,
    isVisible: snapshot?.isVisible !== false,
  };
};

const applyCheckoutCouponToItem = (item = {}, appliedCode = "", liveCouponMap = {}) => {
  const normalizedAppliedCode = normalizeCouponCode(appliedCode);
  if (!normalizedAppliedCode) return item;

  const eligibleCoupon = getEligibleCouponForCheckoutItem(item, liveCouponMap);
  if (!eligibleCoupon || eligibleCoupon.code !== normalizedAppliedCode) return item;

  const quantity = Math.max(Number(item?.quantity) || 1, 1);
  const addOnPrice = getAddonPrice(item);
  const storedOriginalUnitPrice = Number(item?.originalPrice || 0);
  const currentUnitPrice = Number(item?.price || 0);
  const originalUnitTotal = storedOriginalUnitPrice > 0 ? storedOriginalUnitPrice : currentUnitPrice;
  const baseProductUnitPrice = Math.max(0, originalUnitTotal - addOnPrice);
  const discountedBaseUnitPrice = eligibleCoupon.forcedPrice
    ? Math.min(baseProductUnitPrice, Number(eligibleCoupon.forcedPrice))
    : Math.max(
      0,
      Number((baseProductUnitPrice - ((baseProductUnitPrice * Number(eligibleCoupon.discountPercent || 0)) / 100)).toFixed(2))
    );
  const nextUnitPrice = Number((discountedBaseUnitPrice + addOnPrice).toFixed(2));
  const discountAmountPerUnit = Number(Math.max(0, originalUnitTotal - nextUnitPrice).toFixed(2));
  const effectivePercent = originalUnitTotal > 0
    ? Number(((discountAmountPerUnit / originalUnitTotal) * 100).toFixed(2))
    : 0;

  return {
    ...item,
    price: nextUnitPrice,
    originalPrice: Number(originalUnitTotal.toFixed(2)),
    discountApplied: {
      code: eligibleCoupon.code,
      percent: effectivePercent,
      basedOn: "checkout_coupon",
      amount: Number((discountAmountPerUnit * quantity).toFixed(2)),
    },
  };
};

const emptyAddressDraft = () => ({
  name: "",
  phone: "",
  pincode: "",
  city: "",
  state: "",
  addressLine: "",
});

const getPhoneVerificationAuth = () => {
  const existingApp = getApps().find((appInstance) => appInstance.name === "checkout-phone-verification");
  if (existingApp) {
    return getAuth(existingApp);
  }

  const verificationApp = initializeApp(firebaseConfig, "checkout-phone-verification");
  return getAuth(verificationApp);
};

// ─── AUTH CONTEXT FIX - also update AuthContext.jsx (see note at bottom) ─────

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { currentUser, userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;
  const [liveCouponMap, setLiveCouponMap] = useState({});
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCheckoutCouponCode, setAppliedCheckoutCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    trackVisitorEvent({
      eventType: "checkout",
      pageUrl: window.location.href,
    });
  }, []);

  // ─── OTP STATE ────────────────────────────────────────────────────────────
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpRequestedPhone, setOtpRequestedPhone] = useState("");
  const [otpResendCount, setOtpResendCount] = useState(0);
  const MAX_OTP_RESENDS = 3;

  // Single reCAPTCHA container ref - we use ONE div in the DOM, always
  const recaptchaContainerRef = useRef(null);
  const recaptchaWidgetIdRef = useRef(null);

  // ─── RECAPTCHA helpers ────────────────────────────────────────────────────
  const destroyRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      recaptchaWidgetIdRef.current = null;
    } catch (_) { /* ignore */ }
  };

  const resetRecaptcha = () => {
    try {
      if (recaptchaWidgetIdRef.current !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(recaptchaWidgetIdRef.current);
      }
    } catch (_) { /* ignore */ }
  };

  const getRecaptchaVerifier = () => {
    if (!recaptchaContainerRef.current) {
      throw new Error("reCAPTCHA is not ready yet. Please try again.");
    }

    if (!window.recaptchaVerifier) {
      const phoneVerificationAuth = getPhoneVerificationAuth();
      window.recaptchaVerifier = new RecaptchaVerifier(
        phoneVerificationAuth,
        recaptchaContainerRef.current,
        { size: "invisible" }
      );
    }
    return window.recaptchaVerifier;
  };

  const ensureRecaptchaReady = async () => {
    const verifier = getRecaptchaVerifier();

    if (recaptchaWidgetIdRef.current === null) {
      recaptchaWidgetIdRef.current = await verifier.render();
    } else {
      resetRecaptcha();
    }

    return verifier;
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  // ─── SEND OTP ─────────────────────────────────────────────────────────────
  const sendOtp = async (phone) => {
    if (otpSending || resendCooldown > 0) {
      return false;
    }

    const sanitizedPhone = normalizeIndianPhone(phone);
    const verifiedPhoneNumbers = currentUser && Array.isArray(userData?.verifiedPhoneNumbers)
      ? userData.verifiedPhoneNumbers.map(normalizeIndianPhone)
      : [];
    const guestVerifiedPhoneNumbers = !currentUser
      ? guestVerifiedPhones.map(normalizeIndianPhone)
      : [];
    const isCurrentNumberVerified =
      verifiedPhoneNumbers.includes(sanitizedPhone) ||
      guestVerifiedPhoneNumbers.includes(sanitizedPhone) ||
      normalizeIndianPhone(currentUser?.phoneNumber || "") === sanitizedPhone ||
      otpVerified;

    if (isCurrentNumberVerified) {
      setOtpVerified(true);
      setOtpSent(false);
      setConfirmationResult(null);
      setOtpRequestedPhone("");
      destroyRecaptcha();
      return true;
    }

    if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
      alert("Enter a valid 10-digit Indian mobile number");
      return false;
    }

    setOtpSending(true);
    try {
      const phoneVerificationAuth = getPhoneVerificationAuth();
      const verifier = await ensureRecaptchaReady();
      const confirmation = await signInWithPhoneNumber(
        phoneVerificationAuth,
        `+91${sanitizedPhone}`,
        verifier
      );
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setOtpRequestedPhone(sanitizedPhone);
      setResendCooldown(30);
      return true;
    } catch (err) {
      resetRecaptcha();

      console.error("sendOtp error:", err);

      if (err?.code === "auth/too-many-requests") {
        setResendCooldown(60);
        alert("Too many OTP attempts. Please wait 60 seconds before trying again.");
        return false;
      }

      if (err?.code === "auth/invalid-app-credential") {
        alert(
          "Real OTP verification is blocked by Firebase app verification settings. " +
          "Check Firebase Phone Auth, authorized domains, and the API key/project config."
        );
        return false;
      }

      if (err?.code === "auth/unauthorized-domain") {
        alert("This domain is not authorized for Firebase phone authentication.");
        return false;
      }

      alert("Failed to send OTP: " + (err?.message || "Please try again."));
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  // ─── VERIFY OTP ───────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (!otp || otp.length < 4) return alert("Enter the OTP");
    if (!confirmationResult) return alert("Please send OTP first");
    if (normalizeIndianPhone(otpPhone) !== otpRequestedPhone) {
      alert("Phone number changed. Please send OTP again.");
      return;
    }

    setVerifying(true);
    try {
      const phoneVerificationAuth = getPhoneVerificationAuth();
      await confirmationResult.confirm(otp);

      if (currentUser) {
        // Persist verification in Firestore via backend for logged-in users.
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_URL}/api/users/${currentUser.uid}/verify-phone`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: normalizeIndianPhone(otpPhone || selectedAddress?.phone || ""),
          }),
        });
        if (!res.ok) throw new Error("Failed to save verification");
        await refreshUserData();
      }
      if (!currentUser) {
        const verifiedPhone = normalizeIndianPhone(otpPhone || selectedAddress?.phone || "");
        if (verifiedPhone) {
          setGuestVerifiedPhones((prev) => {
            const normalized = prev.map(normalizeIndianPhone);
            if (normalized.includes(verifiedPhone)) return prev;
            const updated = [...normalized, verifiedPhone];
            localStorage.setItem(guestVerifiedPhonesStorageKey, JSON.stringify(updated));
            return updated;
          });
        }
      }

      setOtpVerified(true);
      setOtpSent(false);
      setOtp("");
      setConfirmationResult(null);
      setResendCooldown(0);
      setOtpRequestedPhone("");
      setOtpResendCount(0);
      resetRecaptcha();
      await signOut(phoneVerificationAuth);

      alert("Phone verified successfully");
    } catch (err) {
      console.error("verifyOtp error:", err);
      alert("Invalid OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // ─── OTP RESEND handler ───────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (otpSending || resendCooldown > 0) return;
    if (otpResendCount >= MAX_OTP_RESENDS) {
      alert("You can resend OTP only 3 times in one session.");
      return;
    }
    setOtp("");
    const ok = await sendOtp(otpPhone || selectedAddress?.phone || "");
    if (ok) {
      setOtpResendCount((prev) => prev + 1);
    }
  };

  // ─── ADDRESS STATE ────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeVerified, setPincodeVerified] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [guestVerifiedPhones, setGuestVerifiedPhones] = useState([]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // ─── Reset OTP whenever selected address changes ──────────────────────────
  // IMPORTANT: selectedAddressId must be in the dependency array!
  useEffect(() => {
    setOtpVerified(false);
    setOtpSent(false);
    setOtp("");
    setConfirmationResult(null);
    setResendCooldown(0);
    setOtpRequestedPhone("");
    setOtpResendCount(0);
    setOtpPhone(normalizeIndianPhone(selectedAddress?.phone || ""));
    destroyRecaptcha();
  }, [selectedAddressId]);

  // If phone is edited after OTP is sent, require a fresh OTP for the new phone.
  useEffect(() => {
    if (!otpSent) return;
    const editedPhone = normalizeIndianPhone(otpPhone);
    if (!otpRequestedPhone || editedPhone === otpRequestedPhone) return;
    setOtpSent(false);
    setOtp("");
    setConfirmationResult(null);
    setResendCooldown(0);
  }, [otpPhone, otpRequestedPhone, otpSent]);

  useEffect(() => {
    return () => destroyRecaptcha();
  }, []);

  useEffect(() => {
    if (currentUser) return;
    try {
      const stored = localStorage.getItem(guestVerifiedPhonesStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      setGuestVerifiedPhones(Array.isArray(parsed) ? parsed.map(normalizeIndianPhone) : []);
    } catch {
      setGuestVerifiedPhones([]);
    }
  }, [currentUser]);

  // ─── Select address handler ───────────────────────────────────────────────
  const handleSelectAddress = (id) => {
    setSelectedAddressId(id);
    // Note: the useEffect above handles OTP reset automatically
  };

  const [address, setAddress] = useState(emptyAddressDraft);
  const [isGiftOrder, setIsGiftOrder] = useState(false);
  const [wantsGiftWrap, setWantsGiftWrap] = useState(false);
  const [giftRecipientAddress, setGiftRecipientAddress] = useState(emptyAddressDraft);
  const [giftPincodeLoading, setGiftPincodeLoading] = useState(false);
  const [giftPincodeVerified, setGiftPincodeVerified] = useState(false);
  const [giftPincodeError, setGiftPincodeError] = useState("");

  const handleChange = (e) =>
    setAddress({ ...address, [e.target.name]: e.target.value });

  const handleGiftRecipientChange = (e) =>
    setGiftRecipientAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const fetchPincodeDetails = async (pin) => {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data?.[0]?.Status !== "Success") {
      throw new Error("Invalid pincode");
    }

    const post = data[0].PostOffice?.[0];
    if (!post) {
      throw new Error("Could not verify pincode");
    }

    return {
      city: post.District || post.Name || "",
      state: post.State || "",
    };
  };

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setAddress((prev) => ({ ...prev, pincode: pin, city: "", state: "" }));
    setPincodeVerified(false);
    setPincodeError("");

    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const details = await fetchPincodeDetails(pin);
        setAddress((prev) => ({
          ...prev,
          pincode: pin,
          city: details.city,
          state: details.state,
        }));
        setPincodeVerified(true);
      } catch (_) {
        setPincodeError("Invalid pincode. Please enter a valid 6-digit pincode.");
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleGiftPincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setGiftRecipientAddress((prev) => ({ ...prev, pincode: pin, city: "", state: "" }));
    setGiftPincodeVerified(false);
    setGiftPincodeError("");

    if (pin.length === 6) {
      setGiftPincodeLoading(true);
      try {
        const details = await fetchPincodeDetails(pin);
        setGiftRecipientAddress((prev) => ({
          ...prev,
          pincode: pin,
          city: details.city,
          state: details.state,
        }));
        setGiftPincodeVerified(true);
      } catch (_) {
        setGiftPincodeError("Invalid recipient pincode. Please enter a valid 6-digit pincode.");
      } finally {
        setGiftPincodeLoading(false);
      }
    }
  };

  // ─── CALCULATIONS ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const couponIds = Array.from(
      new Set(
        cartItems
          .map((item) => String(item?.couponId || item?.couponSnapshot?.id || item?.coupon?.id || "").trim())
          .filter(Boolean)
      )
    );

    if (!couponIds.length) {
      setLiveCouponMap({});
      return;
    }

    const fetchCoupons = async () => {
      try {
        const responses = await Promise.all(
          couponIds.map(async (couponId) => {
            const res = await fetch(`${API_URL}/api/coupons/${couponId}`);
            if (!res.ok) return null;
            const data = await res.json();
            return sanitizeCouponData(data);
          })
        );

        if (cancelled) return;

        const nextMap = responses.reduce((acc, coupon) => {
          if (coupon?.id) acc[coupon.id] = coupon;
          return acc;
        }, {});

        setLiveCouponMap(nextMap);
      } catch {
        if (!cancelled) setLiveCouponMap({});
      }
    };

    fetchCoupons();

    return () => {
      cancelled = true;
    };
  }, [API_URL, cartItems]);

  const cartSubtotal = useMemo(
    () => cartItems.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    ),
    [cartItems]
  );
  const checkoutItems = useMemo(
    () => cartItems.map((item) => applyCheckoutCouponToItem(item, appliedCheckoutCouponCode, liveCouponMap)),
    [cartItems, appliedCheckoutCouponCode, liveCouponMap]
  );
  const subtotal = useMemo(
    () => checkoutItems.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    ),
    [checkoutItems]
  );
  const couponDiscountAmount = Math.max(0, Number((cartSubtotal - subtotal).toFixed(2)));
  const hasGiftStoreItems = cartItems.some(
    (item) => String(item?.checkoutContext?.source || "").trim().toLowerCase() === "gift-store"
  );
  const giftWrapFee = isGiftOrder && wantsGiftWrap ? GIFT_WRAP_FEE : 0;
  const total = parseFloat((subtotal + giftWrapFee).toFixed(2));
  const source = localStorage.getItem("traffic_source") || "WEBSITE";

  useEffect(() => {
    if (!cartItems.length || total <= 0) return;
    trackGtmBeginCheckout({
      value: total,
      items: checkoutItems,
      source,
    });
  }, [cartItems.length, checkoutItems, total, source]);

  useEffect(() => {
    if (!appliedCheckoutCouponCode) return;
    const hasMatch = cartItems.some((item) => {
      const eligibleCoupon = getEligibleCouponForCheckoutItem(item, liveCouponMap);
      return eligibleCoupon?.code === appliedCheckoutCouponCode;
    });

    if (!hasMatch) {
      setAppliedCheckoutCouponCode("");
      setCouponFeedback({ type: "", text: "" });
    }
  }, [appliedCheckoutCouponCode, cartItems, liveCouponMap]);

  const handleApplyCheckoutCoupon = () => {
    const normalizedCode = normalizeCouponCode(couponCodeInput);
    if (!normalizedCode) {
      setCouponFeedback({ type: "error", text: "Enter a coupon code." });
      return;
    }

    const matchedItems = cartItems.filter((item) => {
      const eligibleCoupon = getEligibleCouponForCheckoutItem(item, liveCouponMap);
      return eligibleCoupon?.code === normalizedCode;
    });

    if (!matchedItems.length) {
      setCouponFeedback({ type: "error", text: "This coupon is not valid for the items in your cart." });
      return;
    }

    setAppliedCheckoutCouponCode(normalizedCode);
    setCouponCodeInput(normalizedCode);
    setCouponFeedback({
      type: "success",
      text: `${normalizedCode} applied to ${matchedItems.length} item${matchedItems.length > 1 ? "s" : ""}.`,
    });
  };

  const handleRemoveCheckoutCoupon = () => {
    setAppliedCheckoutCouponCode("");
    setCouponCodeInput("");
    setCouponFeedback({ type: "", text: "" });
  };

  // ─── FETCH ADDRESSES ──────────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/users/${currentUser.uid}/address`);
          const data = await res.json();
          setAddresses(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Address fetch failed:", err);
        }
      })();
      return;
    }

    try {
      const stored = localStorage.getItem(guestAddressStorageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      setAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAddresses([]);
    }
  }, [currentUser, API_URL]);

  useEffect(() => {
    if (!selectedAddressId) {
      setSelectedAddressId(addresses[0]?.id || null);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (hasGiftStoreItems) return;
    setIsGiftOrder(false);
    setWantsGiftWrap(false);
    setGiftRecipientAddress(emptyAddressDraft());
    setGiftPincodeVerified(false);
    setGiftPincodeError("");
  }, [hasGiftStoreItems]);

  // ─── LOAD RAZORPAY SCRIPT ─────────────────────────────────────────────────
  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.ilikaRazorpay = "true";
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // ─── CLEAN STALE PIXEL DATA ───────────────────────────────────────────────
  useEffect(() => {
    localStorage.removeItem("order_total");
    localStorage.removeItem("order_items");
    sessionStorage.removeItem("purchase_value");
    sessionStorage.removeItem("purchase_items");
  }, []);

  // ─── SAVE ADDRESS ─────────────────────────────────────────────────────────
  const saveAddress = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;

    if (!address.name.trim()) { alert("Please enter your full name"); return; }
    if (!phoneRegex.test(address.phone)) { alert("Please enter a valid 10-digit Indian mobile number"); return; }
    if (!pincodeRegex.test(address.pincode)) { alert("Please enter a valid 6-digit pincode"); return; }
    if (!pincodeVerified) { alert("Please verify a valid pincode to auto-fill city and state."); return; }
    if (!address.city.trim()) { alert("Please enter your city"); return; }
    if (!address.state.trim()) { alert("Please enter your state"); return; }
    if (!address.addressLine.trim()) { alert("Please enter your full address"); return; }

    if (!currentUser) {
      const guestAddress = {
        id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...address,
      };
      const updated = [...addresses, guestAddress];
      setAddresses(updated);
      setSelectedAddressId(guestAddress.id);
      setShowForm(false);
      localStorage.setItem(guestAddressStorageKey, JSON.stringify(updated));
      setAddress({ name: "", phone: "", pincode: "", city: "", state: "", addressLine: "" });
      setPincodeVerified(false);
      setPincodeError("");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/${currentUser.uid}/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const newAddress = { id: data.id, ...address };
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(data.id);
      setShowForm(false);

      // Reset form
      setAddress({ name: "", phone: "", pincode: "", city: "", state: "", addressLine: "" });
      setPincodeVerified(false);
      setPincodeError("");
      // OTP reset is handled by the selectedAddressId useEffect above
    } catch (err) {
      console.error("Save address error:", err);
      alert("Failed to save address");
    }
  };

  // ─── PAYMENT METHOD ───────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState(() => {
    if (typeof window === "undefined") return "COD";
    const preferred = sessionStorage.getItem(PREFERRED_PAYMENT_METHOD_KEY);
    return preferred === "ONLINE" ? "ONLINE" : "COD";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (paymentMethod === "ONLINE") {
      sessionStorage.setItem(PREFERRED_PAYMENT_METHOD_KEY, "ONLINE");
      return;
    }
    sessionStorage.removeItem(PREFERRED_PAYMENT_METHOD_KEY);
  }, [paymentMethod]);

  // ─── PHONE VERIFIED CHECK ─────────────────────────────────────────────────
  const selectedPhone = normalizeIndianPhone(selectedAddress?.phone || "");
  const verifiedPhoneNumbers = currentUser && Array.isArray(userData?.verifiedPhoneNumbers)
    ? userData.verifiedPhoneNumbers.map(normalizeIndianPhone)
    : [];
  const guestVerifiedPhoneNumbers = !currentUser
    ? guestVerifiedPhones.map(normalizeIndianPhone)
    : [];
  const isSelectedPhoneLinked = Boolean(
    selectedPhone &&
    normalizeIndianPhone(currentUser?.phoneNumber || "") === selectedPhone
  );
  const isPhoneVerified = Boolean(
    selectedPhone &&
    (
      verifiedPhoneNumbers.includes(selectedPhone) ||
      guestVerifiedPhoneNumbers.includes(selectedPhone) ||
      isSelectedPhoneLinked ||
      otpVerified
    )
  );

  // Show OTP widget only when an address is selected and phone not yet verified
  const showOtpWidget = selectedAddress && !isPhoneVerified;
  const phoneChangedSinceOtp =
    Boolean(otpSent && otpRequestedPhone) &&
    normalizeIndianPhone(otpPhone) !== otpRequestedPhone;

  const validateGiftRecipientAddress = () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;

    if (!giftRecipientAddress.name.trim()) {
      alert("Please enter the recipient's full name");
      return false;
    }
    if (!phoneRegex.test(giftRecipientAddress.phone)) {
      alert("Please enter a valid 10-digit recipient mobile number");
      return false;
    }
    if (!pincodeRegex.test(giftRecipientAddress.pincode)) {
      alert("Please enter a valid 6-digit recipient pincode");
      return false;
    }
    if (!giftPincodeVerified) {
      alert("Please verify a valid recipient pincode to auto-fill city and state.");
      return false;
    }
    if (!giftRecipientAddress.city.trim()) {
      alert("Please enter the recipient city");
      return false;
    }
    if (!giftRecipientAddress.state.trim()) {
      alert("Please enter the recipient state");
      return false;
    }
    if (!giftRecipientAddress.addressLine.trim()) {
      alert("Please enter the recipient full address");
      return false;
    }
    return true;
  };

  // ─── PLACE ORDER ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (loading) return;

    if (!selectedAddressId) {
      alert("Please select an address");
      return;
    }
    if (!selectedAddress) {
      alert("Selected address is invalid. Please choose another address.");
      return;
    }

    if (!isPhoneVerified) {
      alert("Please verify your phone number before placing the order");
      return;
    }
    if (hasGiftStoreItems && isGiftOrder && !validateGiftRecipientAddress()) {
      return;
    }

    setLoading(true);

    trackInitiateCheckout(total, checkoutItems.length);
    trackAddPaymentInfo(total, checkoutItems.length);

    try {
      const itemsPayload = checkoutItems.map((item) => {
        const itemPricing = getCartItemDisplayPricing(item);
        const variantName = getCartItemVariantName(item);

        return {
          id: item.id,
          baseProductId: item.baseProductId || null,
          variantId: item.variantId || null,
          variantName: variantName || null,
          name: item.name,
          hsnCode: item.hsnCode || item.hsn || null,
          gstRate: item.gstRate ?? null,
          price: Number(itemPricing.price),
          compareAtPrice: itemPricing.compareAtPrice ?? null,
          quantity: Number(item.quantity) || 1,
          image: getCartItemDisplayImage(item),
          variantLabel: variantName || null,
          sku: item.sku || null,
          stock: item.stock ?? null,
          originalPrice: item.originalPrice || null,
          discountApplied: item.discountApplied || null,
          selectedAddOn: item.selectedAddOn || null,
          isCombo: item.isCombo || false,
          comboItems: item.comboItems || item.items || [],
        };
      });
      const giftOptionsPayload = {
        isGiftOrder: Boolean(hasGiftStoreItems && isGiftOrder),
        wantsGiftWrap: Boolean(hasGiftStoreItems && isGiftOrder && wantsGiftWrap),
        giftWrapFee,
        buyerAddress: selectedAddress || null,
        recipientAddress:
          hasGiftStoreItems && isGiftOrder
            ? { ...giftRecipientAddress }
            : null,
      };

      /* ── COD FLOW ── */
      if (paymentMethod === "COD") {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser?.uid || null,
            userEmail: currentUser?.email || null,
            items: itemsPayload,
            totalAmount: total,
            shippingAddressId: currentUser ? selectedAddressId : null,
            shippingAddress: selectedAddress || null,
            giftOptions: giftOptionsPayload,
            paymentMethod: "COD",
            source,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (window.__allowNextPurchase) window.__allowNextPurchase();
        trackPurchase(data.orderId, parseFloat(Number(total).toFixed(2)), checkoutItems.length);
        savePendingGtmPurchase({
          orderId: data.orderId,
          value: parseFloat(Number(total).toFixed(2)),
          items: checkoutItems,
          paymentMethod: "COD",
          source,
        });

        navigate(`/order-success/${data.orderId}`);
        clearCart();
        return;
      }

      /* ── ONLINE PAYMENT FLOW ── */
      const orderRes = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });
      const razorpayOrder = await orderRes.json();
      if (!orderRes.ok) throw new Error(razorpayOrder.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: "Ilika",
        description: "Order Payment",
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  userId: currentUser?.uid || null,
                  userEmail: currentUser?.email || null,
                  items: itemsPayload,
                  totalAmount: total,
                  shippingAddressId: currentUser ? selectedAddressId : null,
                  shippingAddress: selectedAddress || null,
                  giftOptions: giftOptionsPayload,
                  source,
                },
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);

            if (window.__allowNextPurchase) window.__allowNextPurchase();
            trackPurchase(verifyData.orderId, parseFloat(Number(total).toFixed(2)), checkoutItems.length);
            savePendingGtmPurchase({
              orderId: verifyData.orderId,
              value: parseFloat(Number(total).toFixed(2)),
              items: checkoutItems,
              paymentMethod: "ONLINE",
              source,
            });

            navigate(`/order-success/${verifyData.orderId}`);
            clearCart();
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      return; // loading released in handler/ondismiss

    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to process order: " + err.message);
    }

    setLoading(false);
  };

  // ─── EMPTY CART GUARD ─────────────────────────────────────────────────────
  if (!cartItems.length)
    return (
      <>
        <MiniDivider />
        <Header />
        <CartDrawer />
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-500">
          <p>Your cart is empty</p>
          <button
            type="button"
            onClick={() => navigate("/shopall")}
            className="bg-black text-white px-6 py-2 rounded-md hover:opacity-90 transition"
          >
            Shop All
          </button>
        </div>
        <Footer />
      </>
    );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Single invisible reCAPTCHA container - always in DOM, never conditionally rendered */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

      <MiniDivider />
      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">

          {/* ── LEFT ── */}
          <div className="space-y-6">
            <Heading level="h1" heading="Select Address" />

            {addresses.map((addr) => (
              <label
                key={addr.id}
                className="block border rounded-xl p-4 cursor-pointer hover:border-black"
              >
                <input
                  type="radio"
                  checked={selectedAddressId === addr.id}
                  onChange={() => handleSelectAddress(addr.id)}
                  className="mr-2"
                />
                <span className="font-medium">{addr.name}</span>
                <p className="text-sm text-gray-600">{addr.addressLine}</p>
                <p className="text-sm text-gray-600">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
                <p className="text-sm text-gray-600">{addr.phone}</p>
              </label>
            ))}

            {/* OTP widget - only shown when address selected and phone unverified */}
            {showOtpWidget && selectedAddress && (
              <OtpWidget
                phone={otpPhone}
                setPhone={setOtpPhone}
                otpSent={otpSent}
                otp={otp}
                setOtp={setOtp}
                otpSending={otpSending}
                verifying={verifying}
                resendCooldown={resendCooldown}
                sendOtp={sendOtp}
                verifyOtp={verifyOtp}
                onResend={handleResendOtp}
                resendCount={otpResendCount}
                maxResendCount={MAX_OTP_RESENDS}
                phoneChangedSinceOtp={phoneChangedSinceOtp}
              />
            )}

            {isPhoneVerified && selectedAddress && (
              <p className="text-green-600 text-sm font-medium">Phone verified</p>
            )}

            <button
              onClick={() => setShowForm(!showForm)}
              className="text-black underline"
            >
              {showForm ? "Cancel" : "+ Add New Address"}
            </button>

            {showForm && (
              <div className="grid sm:grid-cols-2 gap-4 border p-4 rounded-xl">
                <input
                  name="name" placeholder="Full Name *"
                  className="border p-3 rounded-lg"
                  onChange={handleChange} value={address.name}
                />
                <input
                  name="phone" placeholder="Phone Number * (10 digits)"
                  maxLength={10} inputMode="numeric"
                  className="border p-3 rounded-lg"
                  onChange={handleChange} value={address.phone}
                />
                <div className="relative">
                  <input
                    name="pincode" placeholder="Pincode * (6 digits)"
                    maxLength={6} inputMode="numeric"
                    className="border p-3 rounded-lg w-full"
                    onChange={handlePincodeChange} value={address.pincode}
                  />
                  {pincodeLoading && (
                    <span className="absolute right-3 top-3.5 text-xs text-gray-400">
                      Fetching…
                    </span>
                  )}
                </div>
                {pincodeError && (
                  <p className="text-xs text-rose-600 sm:col-span-2">{pincodeError}</p>
                )}
                <input
                  name="city" placeholder="City *"
                  className="border p-3 rounded-lg bg-gray-50"
                  value={address.city}
                  readOnly
                />
                <input
                  name="state" placeholder="State *"
                  className="border p-3 rounded-lg sm:col-span-2 bg-gray-50"
                  value={address.state}
                  readOnly
                />
                <textarea
                  name="addressLine"
                  placeholder="House No., Street, Area, Landmark *"
                  rows="3"
                  className="border p-3 rounded-lg sm:col-span-2"
                  onChange={handleChange} value={address.addressLine}
                />
                <button
                  onClick={saveAddress}
                  className="bg-black text-white py-2 rounded-lg sm:col-span-2"
                >
                  Save Address
                </button>
              </div>
            )}

            {hasGiftStoreItems && (
              <div className="rounded-xl border border-[#f1dfd9] bg-white p-4">
                <h3 className="font-semibold text-[#231815]">Gift Options</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This cart includes a product from Gift Gallery. Tell us if this order is a gift.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gift-order"
                      checked={!isGiftOrder}
                      onChange={() => {
                        setIsGiftOrder(false);
                        setWantsGiftWrap(false);
                      }}
                    />
                    No, this is for me
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gift-order"
                      checked={isGiftOrder}
                      onChange={() => setIsGiftOrder(true)}
                    />
                    Yes, this is a gift
                  </label>
                </div>

                {isGiftOrder ? (
                  <div className="mt-4 space-y-4">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-[#f1dfd9] bg-[#fff8f6] px-4 py-3 text-sm">
                      <span className="font-medium text-[#231815]">Add gift wrapping</span>
                      <span className="flex items-center gap-3">
                        <span className="font-semibold text-[#b34140]">+ ₹{GIFT_WRAP_FEE}</span>
                        <input
                          type="checkbox"
                          checked={wantsGiftWrap}
                          onChange={(e) => setWantsGiftWrap(e.target.checked)}
                        />
                      </span>
                    </label>

                    <div className="rounded-xl border border-[#f1dfd9] p-4">
                      <h4 className="font-medium text-[#231815]">Recipient Address</h4>
                      <p className="mt-1 text-xs text-gray-500">
                        We will ship the gift to this person instead of your own address.
                      </p>

                      <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        <input
                          name="name"
                          placeholder="Recipient Full Name *"
                          className="border p-3 rounded-lg"
                          onChange={handleGiftRecipientChange}
                          value={giftRecipientAddress.name}
                        />
                        <input
                          name="phone"
                          placeholder="Recipient Phone Number *"
                          maxLength={10}
                          inputMode="numeric"
                          className="border p-3 rounded-lg"
                          onChange={handleGiftRecipientChange}
                          value={giftRecipientAddress.phone}
                        />
                        <div className="relative">
                          <input
                            name="pincode"
                            placeholder="Recipient Pincode *"
                            maxLength={6}
                            inputMode="numeric"
                            className="border p-3 rounded-lg w-full"
                            onChange={handleGiftPincodeChange}
                            value={giftRecipientAddress.pincode}
                          />
                          {giftPincodeLoading && (
                            <span className="absolute right-3 top-3.5 text-xs text-gray-400">
                              Fetching...
                            </span>
                          )}
                        </div>
                        {giftPincodeError ? (
                          <p className="text-xs text-rose-600 sm:col-span-2">{giftPincodeError}</p>
                        ) : null}
                        <input
                          name="city"
                          placeholder="Recipient City *"
                          className="border p-3 rounded-lg bg-gray-50"
                          value={giftRecipientAddress.city}
                          readOnly
                        />
                        <input
                          name="state"
                          placeholder="Recipient State *"
                          className="border p-3 rounded-lg sm:col-span-2 bg-gray-50"
                          value={giftRecipientAddress.state}
                          readOnly
                        />
                        <textarea
                          name="addressLine"
                          placeholder="Recipient House No., Street, Area, Landmark *"
                          rows="3"
                          className="border p-3 rounded-lg sm:col-span-2"
                          onChange={handleGiftRecipientChange}
                          value={giftRecipientAddress.addressLine}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* PAYMENT METHOD */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-3">Payment Method</h3>
              <label className="flex items-center gap-2 text-sm mb-2">
                <input
                  type="radio"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Cash on Delivery
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                />
                Pay Online
              </label>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="bg-white border rounded-xl p-5 h-fit sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {checkoutItems.map((item) => (
              <div key={item.id} className="border-b pb-3 mb-3">
                <div className="flex gap-3">
                  <img loading="lazy"
                    src={getCartItemDisplayImage(item)}
                    className="w-16 h-16 rounded-md object-cover"
                    alt={item.name}
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                    {getCartItemVariantName(item) ? (
                      <p className="text-gray-500 text-xs mt-0.5">{getCartItemVariantName(item)}</p>
                    ) : null}
                    {item.selectedAddOn?.label ? (
                      <p className="text-emerald-700 text-xs mt-0.5">Add-on: {item.selectedAddOn.label}</p>
                    ) : null}
                  </div>
                  <div className="font-medium text-sm">
                    ₹{Number((Number(getCartItemDisplayPricing(item).price) * Number(item.quantity)).toFixed(2)).toLocaleString("en-IN")}
                  </div>
                </div>

                {getCartItemDisplayPricing(item).compareAtPrice && getCartItemDisplayPricing(item).compareAtPrice > getCartItemDisplayPricing(item).price ? (
                  <p className="mt-1 ml-[76px] text-xs text-gray-400 line-through">
                    MRP ₹{Number(getCartItemDisplayPricing(item).compareAtPrice).toLocaleString("en-IN")}
                  </p>
                ) : null}

                {item.discountApplied?.code ? (
                  <p className="mt-1 ml-[76px] text-xs text-emerald-700">
                    Coupon {item.discountApplied.code} applied
                  </p>
                ) : null}

                {item.isCombo && Array.isArray(item.comboItems) && item.comboItems.length > 0 && (
                  <div className="mt-2 ml-[76px] rounded-lg bg-gray-50 p-2 space-y-1.5">
                    {item.comboItems.map((sub, index) => {
                      const isSurpriseMask =
                        Boolean(sub?.isFree) || /\(free\)/i.test(sub?.name || "");
                      const freeMaskName =
                        sub?.name && sub.name.trim()
                          ? sub.name
                          : "Hydra Gel Face Moisturizer";

                      return (
                        <div key={`${item.id}-combo-${index}`} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">
                            {isSurpriseMask ? freeMaskName : sub?.name}
                          </span>
                          <span className="text-gray-500">x{item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="mt-4 space-y-2 text-sm">
              <div className="rounded-2xl border border-[#ead5de] bg-[#fff9fb] p-3">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#7b5568]">
                  Apply Coupon At Checkout
                </label>
                <div className="flex overflow-hidden rounded-xl border border-[#ead5de] bg-white">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value);
                      if (couponFeedback.type === "error") {
                        setCouponFeedback({ type: "", text: "" });
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCheckoutCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCheckoutCoupon}
                    className="bg-black px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Apply
                  </button>
                </div>
                {couponFeedback.text ? (
                  <p className={`mt-2 text-xs font-medium ${couponFeedback.type === "error" ? "text-rose-600" : "text-emerald-700"}`}>
                    {couponFeedback.text}
                  </p>
                ) : null}
                {appliedCheckoutCouponCode ? (
                  <button
                    type="button"
                    onClick={handleRemoveCheckoutCoupon}
                    className="mt-2 text-xs font-semibold text-[#b24074] underline underline-offset-4"
                  >
                    Remove coupon
                  </button>
                ) : null}
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {appliedCheckoutCouponCode && couponDiscountAmount > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon ({appliedCheckoutCouponCode})</span>
                  <span>-₹{couponDiscountAmount.toLocaleString("en-IN")}</span>
                </div>
              ) : null}
              {isGiftOrder && wantsGiftWrap ? (
                <div className="flex justify-between">
                  <span>Gift wrapping</span><span>₹{giftWrapFee}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-900">Free</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span><span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handlePlaceOrder}
              className="mt-6 w-full bg-black text-white py-3 rounded-xl hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Processing Payment" : "Continue to Payment"}
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
};

export default Checkout;

