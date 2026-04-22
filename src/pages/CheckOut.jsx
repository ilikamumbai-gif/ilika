import React, { useState, useEffect, useRef } from "react";
import { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } from "../utils/pixel";
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

// ─── OTP WIDGET — defined OUTSIDE Checkout so it never re-mounts on re-render ─
// If defined inside the parent component, React treats it as a new component
// type on every render and unmounts/remounts it, destroying all input state.
const OtpWidget = ({
  phone,
  otpSent,
  otp,
  setOtp,
  otpSending,
  verifying,
  resendCooldown,
  sendOtp,
  verifyOtp,
  onResend,
}) => (
  <div className="border p-4 rounded-xl mt-3 bg-gray-50">
    <p className="text-sm mb-3 text-gray-700">
      Verify your phone number: <strong>{phone}</strong>
    </p>

    {!otpSent ? (
      <button
        onClick={() => sendOtp(phone)}
        disabled={otpSending || resendCooldown > 0}
        className="bg-gray-200 p-2 rounded w-full disabled:opacity-50 text-sm font-medium"
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
            disabled={verifying || otp.length < 4}
            className="bg-black text-white p-2 rounded flex-1 disabled:opacity-50 text-sm font-medium"
          >
            {verifying ? "Verifying…" : "Verify OTP"}
          </button>
          <button
            onClick={onResend}
            disabled={otpSending || resendCooldown > 0}
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
      </>
    )}
  </div>
);

const normalizeIndianPhone = (phone = "") =>
  String(phone).replace(/\D/g, "").slice(-10);

const getPhoneVerificationAuth = () => {
  const existingApp = getApps().find((appInstance) => appInstance.name === "checkout-phone-verification");
  if (existingApp) {
    return getAuth(existingApp);
  }

  const verificationApp = initializeApp(firebaseConfig, "checkout-phone-verification");
  return getAuth(verificationApp);
};

// ─── AUTH CONTEXT FIX — also update AuthContext.jsx (see note at bottom) ─────

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { currentUser, userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // ─── OTP STATE ────────────────────────────────────────────────────────────
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Single reCAPTCHA container ref — we use ONE div in the DOM, always
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
    if (!currentUser) {
      alert("Please log in before verifying your phone number");
      return;
    }

    if (otpSending || resendCooldown > 0) {
      return;
    }

    const sanitizedPhone = normalizeIndianPhone(phone);
    const verifiedPhoneNumbers = Array.isArray(userData?.verifiedPhoneNumbers)
      ? userData.verifiedPhoneNumbers.map(normalizeIndianPhone)
      : [];
    const isCurrentNumberVerified =
      verifiedPhoneNumbers.includes(sanitizedPhone) ||
      normalizeIndianPhone(currentUser?.phoneNumber || "") === sanitizedPhone ||
      otpVerified;

    if (isCurrentNumberVerified) {
      setOtpVerified(true);
      setOtpSent(false);
      setConfirmationResult(null);
      destroyRecaptcha();
      return;
    }

    if (!/^[6-9]\d{9}$/.test(sanitizedPhone)) {
      alert("Enter a valid 10-digit Indian mobile number");
      return;
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
      setResendCooldown(30);
    } catch (err) {
      resetRecaptcha();

      console.error("sendOtp error:", err);

      if (err?.code === "auth/too-many-requests") {
        setResendCooldown(60);
        alert("Too many OTP attempts. Please wait 60 seconds before trying again.");
        return;
      }

      if (err?.code === "auth/invalid-app-credential") {
        alert(
          "Real OTP verification is blocked by Firebase app verification settings. " +
          "Check Firebase Phone Auth, authorized domains, and the API key/project config."
        );
        return;
      }

      if (err?.code === "auth/unauthorized-domain") {
        alert("This domain is not authorized for Firebase phone authentication.");
        return;
      }

      alert("Failed to send OTP: " + (err?.message || "Please try again."));
    } finally {
      setOtpSending(false);
    }
  };

  // ─── VERIFY OTP ───────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (!otp || otp.length < 4) return alert("Enter the OTP");
    if (!confirmationResult) return alert("Please send OTP first");

    setVerifying(true);
    try {
      const phoneVerificationAuth = getPhoneVerificationAuth();
      await confirmationResult.confirm(otp);

      // Persist verification in Firestore via backend
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/users/${currentUser.uid}/verify-phone`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizeIndianPhone(selectedAddress?.phone || ""),
        }),
      });
      if (!res.ok) throw new Error("Failed to save verification");

      // Refresh userData so userData.phoneVerified becomes true
      await refreshUserData();

      setOtpVerified(true);
      setOtpSent(false);
      setOtp("");
      setConfirmationResult(null);
      setResendCooldown(0);
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
  const handleResendOtp = () => {
    if (otpSending || resendCooldown > 0) return;
    setOtpSent(false);
    setOtp("");
    setConfirmationResult(null);
    resetRecaptcha();
  };

  // ─── ADDRESS STATE ────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // ─── Reset OTP whenever selected address changes ──────────────────────────
  // IMPORTANT: selectedAddressId must be in the dependency array!
  useEffect(() => {
    setOtpVerified(false);
    setOtpSent(false);
    setOtp("");
    setConfirmationResult(null);
    setResendCooldown(0);
    destroyRecaptcha();
  }, [selectedAddressId]);

  useEffect(() => {
    return () => destroyRecaptcha();
  }, []);

  // ─── Select address handler ───────────────────────────────────────────────
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
          }
        }
      } catch (_) { /* silent fail */ } finally {
        setPincodeLoading(false);
      }
    }
  };

  // ─── CALCULATIONS ─────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const total = parseFloat(subtotal.toFixed(2));

  // ─── FETCH ADDRESSES ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${currentUser.uid}/address`);
        const data = await res.json();
        setAddresses(data);
      } catch (err) {
        console.error("Address fetch failed:", err);
      }
    })();
  }, [currentUser, API_URL]);

  // ─── LOAD RAZORPAY SCRIPT ─────────────────────────────────────────────────
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
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
    if (!currentUser) return alert("Login required");

    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;

    if (!address.name.trim()) { alert("Please enter your full name"); return; }
    if (!phoneRegex.test(address.phone)) { alert("Please enter a valid 10-digit Indian mobile number"); return; }
    if (!pincodeRegex.test(address.pincode)) { alert("Please enter a valid 6-digit pincode"); return; }
    if (!address.city.trim()) { alert("Please enter your city"); return; }
    if (!address.state.trim()) { alert("Please enter your state"); return; }
    if (!address.addressLine.trim()) { alert("Please enter your full address"); return; }

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
      // OTP reset is handled by the selectedAddressId useEffect above
    } catch (err) {
      console.error("Save address error:", err);
      alert("Failed to save address");
    }
  };

  // ─── PAYMENT METHOD ───────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // ─── PHONE VERIFIED CHECK ─────────────────────────────────────────────────
  const selectedPhone = normalizeIndianPhone(selectedAddress?.phone || "");
  const verifiedPhoneNumbers = Array.isArray(userData?.verifiedPhoneNumbers)
    ? userData.verifiedPhoneNumbers.map(normalizeIndianPhone)
    : [];
  const isSelectedPhoneLinked = Boolean(
    selectedPhone &&
    normalizeIndianPhone(currentUser?.phoneNumber || "") === selectedPhone
  );
  const isPhoneVerified = Boolean(
    selectedPhone &&
    (verifiedPhoneNumbers.includes(selectedPhone) || isSelectedPhoneLinked || otpVerified)
  );

  // Show OTP widget only when an address is selected and phone not yet verified
  const showOtpWidget = selectedAddress && !isPhoneVerified;

  // ─── PLACE ORDER ──────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (loading) return;

    if (!currentUser) {
      alert("Login required");
      navigate("/login");
      return;
    }

    if (!selectedAddressId) {
      alert("Please select an address");
      return;
    }

    if (!isPhoneVerified) {
      alert("Please verify your phone number before placing the order");
      return;
    }

    setLoading(true);

    const source = localStorage.getItem("traffic_source") || "WEBSITE";

    trackInitiateCheckout(total, cartItems.length);
    trackAddPaymentInfo(total, cartItems.length);

    try {
      const itemsPayload = cartItems.map((item) => ({
        id: item.id,
        baseProductId: item.baseProductId || null,
        variantId: item.variantId || null,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image || item.images?.[0] || item.imageUrl || "",
        variantLabel: item.variantLabel || null,
        originalPrice: item.originalPrice || null,
        discountApplied: item.discountApplied || null,
        isCombo: item.isCombo || false,
        comboItems: item.comboItems || item.items || [],
      }));

      /* ── COD FLOW ── */
      if (paymentMethod === "COD") {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: itemsPayload,
            totalAmount: total,
            shippingAddressId: selectedAddressId,
            paymentMethod: "COD",
            source,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (window.__allowNextPurchase) window.__allowNextPurchase();
        trackPurchase(data.orderId, parseFloat(Number(total).toFixed(2)), cartItems.length);

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
                  userId: currentUser.uid,
                  userEmail: currentUser.email,
                  items: itemsPayload,
                  totalAmount: total,
                  shippingAddressId: selectedAddressId,
                  source,
                },
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error);

            if (window.__allowNextPurchase) window.__allowNextPurchase();
            trackPurchase(verifyData.orderId, parseFloat(Number(total).toFixed(2)), cartItems.length);

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
        <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
          Your cart is empty
        </div>
        <Footer />
      </>
    );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Single invisible reCAPTCHA container — always in DOM, never conditionally rendered */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

      <MiniDivider />
      <div className="primary-bg-color">
        <Header />
        <CartDrawer />

        <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">

          {/* ── LEFT ── */}
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
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <p className="text-sm text-gray-600">{addr.phone}</p>
              </label>
            ))}

            {/* OTP widget — only shown when address selected and phone unverified */}
            {showOtpWidget && selectedAddress && (
              <OtpWidget
                phone={selectedAddress.phone}
                otpSent={otpSent}
                otp={otp}
                setOtp={setOtp}
                otpSending={otpSending}
                verifying={verifying}
                resendCooldown={resendCooldown}
                sendOtp={sendOtp}
                verifyOtp={verifyOtp}
                onResend={handleResendOtp}
              />
            )}

            {isPhoneVerified && selectedAddress && (
              <p className="text-green-600 text-sm font-medium">✅ Phone verified</p>
            )}

            <button
              onClick={() => setShowForm(!showForm)}
              className="text-black underline"
            >
              {showForm ? "— Cancel" : "+ Add New Address"}
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
                <input
                  name="city" placeholder="City *"
                  className="border p-3 rounded-lg"
                  onChange={handleChange} value={address.city}
                />
                <input
                  name="state" placeholder="State *"
                  className="border p-3 rounded-lg sm:col-span-2"
                  onChange={handleChange} value={address.state}
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

          {/* ── RIGHT ── */}
          <div className="bg-white border rounded-xl p-5 h-fit sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 border-b pb-3 mb-3">
                <img loading="lazy"
                  src={item.image || item.images?.[0] || item.imageUrl || "/placeholder.webp"}
                  className="w-16 h-16 rounded-md object-cover"
                  alt={item.name}
                />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="font-medium text-sm">
                  ₹{Number(item.price) * Number(item.quantity)}
                </div>
              </div>
            ))}

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span><span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-green-900">Free</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span><span>₹{total}</span>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handlePlaceOrder}
              className="mt-6 w-full bg-black text-white py-3 rounded-xl hover:bg-gray-900 transition disabled:opacity-60"
            >
              {loading ? "Processing Payment…" : "Continue to Payment"}
            </button>
          </div>

        </div>
      </div>

      <Footer />
    </>
  );
};

export default Checkout;
