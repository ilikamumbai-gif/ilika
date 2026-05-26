import React, { useState, useEffect, useRef } from "react";
import { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } from "../utils/pixel";
import { trackGtmBeginCheckout, savePendingGtmPurchase } from "../utils/gtm";
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

// â”€â”€â”€ OTP WIDGET - defined OUTSIDE Checkout so it never re-mounts on re-render â”€
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
        {otpSending ? "Sending OTPâ€¦" : "Send OTP"}
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
            {verifying ? "Verifyingâ€¦" : "Verify OTP"}
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
const guestAddressStorageKey = "guest_checkout_addresses";
const guestVerifiedPhonesStorageKey = "guest_verified_phones";

const getPhoneVerificationAuth = () => {
  const existingApp = getApps().find((appInstance) => appInstance.name === "checkout-phone-verification");
  if (existingApp) {
    return getAuth(existingApp);
  }

  const verificationApp = initializeApp(firebaseConfig, "checkout-phone-verification");
  return getAuth(verificationApp);
};

// â”€â”€â”€ AUTH CONTEXT FIX - also update AuthContext.jsx (see note at bottom) â”€â”€â”€â”€â”€

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { currentUser, userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // â”€â”€â”€ OTP STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ RECAPTCHA helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ SEND OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ VERIFY OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ OTP RESEND handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ ADDRESS STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeVerified, setPincodeVerified] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [guestVerifiedPhones, setGuestVerifiedPhones] = useState([]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // â”€â”€â”€ Reset OTP whenever selected address changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Select address handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSelectAddress = (id) => {
    setSelectedAddressId(id);
    // Note: the useEffect above handles OTP reset automatically
  };

  const [address, setAddress] = useState({
    name: "", phone: "", pincode: "", city: "", state: "", addressLine: "",
  });

  const handleChange = (e) =>
    setAddress({ ...address, [e.target.name]: e.target.value });

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setAddress((prev) => ({ ...prev, pincode: pin, city: "", state: "" }));
    setPincodeVerified(false);
    setPincodeError("");

    if (pin.length === 6) {
      setPincodeLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data?.[0]?.Status === "Success") {
          const post = data[0].PostOffice?.[0];
          if (post) {
            setAddress((prev) => ({
              ...prev,
              pincode: pin,
              city: post.District || post.Name || "",
              state: post.State || "",
            }));
            setPincodeVerified(true);
          } else {
            setPincodeError("Could not verify pincode. Please try another one.");
          }
        } else {
          setPincodeError("Invalid pincode. Please enter a valid 6-digit pincode.");
        }
      } catch (_) {
        setPincodeError("Could not verify pincode right now. Please try again.");
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // â”€â”€â”€ CALCULATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const total = parseFloat(subtotal.toFixed(2));
  const source = localStorage.getItem("traffic_source") || "WEBSITE";

  useEffect(() => {
    if (!cartItems.length || total <= 0) return;
    trackGtmBeginCheckout({
      value: total,
      items: cartItems,
      source,
    });
  }, [cartItems, total, source]);

  // â”€â”€â”€ FETCH ADDRESSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ LOAD RAZORPAY SCRIPT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ CLEAN STALE PIXEL DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    localStorage.removeItem("order_total");
    localStorage.removeItem("order_items");
    sessionStorage.removeItem("purchase_value");
    sessionStorage.removeItem("purchase_items");
  }, []);

  // â”€â”€â”€ SAVE ADDRESS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ PAYMENT METHOD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // â”€â”€â”€ PHONE VERIFIED CHECK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ PLACE ORDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    setLoading(true);

    trackInitiateCheckout(total, cartItems.length);
    trackAddPaymentInfo(total, cartItems.length);

    try {
      const itemsPayload = cartItems.map((item) => ({
        id: item.id,
        baseProductId: item.baseProductId || null,
        variantId: item.variantId || null,
        name: item.name,
        hsnCode: item.hsnCode || item.hsn || null,
        gstRate: item.gstRate ?? null,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image || item.images?.[0] || item.imageUrl || "",
        variantLabel: item.variantLabel || null,
        originalPrice: item.originalPrice || null,
        discountApplied: item.discountApplied || null,
        selectedAddOn: item.selectedAddOn || null,
        isCombo: item.isCombo || false,
        comboItems: item.comboItems || item.items || [],
      }));

      /* â”€â”€ COD FLOW â”€â”€ */
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
            paymentMethod: "COD",
            source,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (window.__allowNextPurchase) window.__allowNextPurchase();
        trackPurchase(data.orderId, parseFloat(Number(total).toFixed(2)), cartItems.length);
        savePendingGtmPurchase({
          orderId: data.orderId,
          value: parseFloat(Number(total).toFixed(2)),
          items: cartItems,
          paymentMethod: "COD",
          source,
        });

        navigate(`/order-success/${data.orderId}`);
        clearCart();
        return;
      }

      /* â”€â”€ ONLINE PAYMENT FLOW â”€â”€ */
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
                  source,
                },
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);

            if (window.__allowNextPurchase) window.__allowNextPurchase();
            trackPurchase(verifyData.orderId, parseFloat(Number(total).toFixed(2)), cartItems.length);
            savePendingGtmPurchase({
              orderId: verifyData.orderId,
              value: parseFloat(Number(total).toFixed(2)),
              items: cartItems,
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

  // â”€â”€â”€ EMPTY CART GUARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <>
      {/* Single invisible reCAPTCHA container - always in DOM, never conditionally rendered */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

      <MiniDivider />
      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">

          {/* â”€â”€ LEFT â”€â”€ */}
          <div className="space-y-6">
            <Heading heading="Select Address" />

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
              <p className="text-green-600 text-sm font-medium">✔… Phone verified</p>
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
                      Fetchingâ€¦
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

          {/* â”€â”€ RIGHT â”€â”€ */}
          <div className="bg-white border rounded-xl p-5 h-fit sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {cartItems.map((item) => (
              <div key={item.id} className="border-b pb-3 mb-3">
                <div className="flex gap-3">
                  <img loading="lazy"
                    src={item.image || item.images?.[0] || item.imageUrl || "/placeholder.webp"}
                    className="w-16 h-16 rounded-md object-cover"
                    alt={item.name}
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                    {item.selectedAddOn?.label ? (
                      <p className="text-emerald-700 text-xs mt-0.5">Add-on: {item.selectedAddOn.label}</p>
                    ) : null}
                  </div>
                  <div className="font-medium text-sm">
                    {Number(item.price) * Number(item.quantity)}
                  </div>
                </div>

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
              <div className="flex justify-between">
                <span>Subtotal</span><span>{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-900">Free</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span><span>{total}</span>
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
