import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { app } from "../firebase/firebaseConfig";
import { trackCompleteRegistration } from "../utils/pixel";

const STEPS = ["Details", "Phone", "Verify"];

const Signup = () => {
  const auth = getAuth(app);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sending, setSending] = useState(false);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
    }
  };

  const sendOtp = async () => {
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setSending(true);
    setError("");
    setupRecaptcha();

    try {
      const result = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setStep(2);
    } catch {
      setError("Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return setError("Enter OTP");
    try {
      await confirmationResult.confirm(otp);
      setOtpVerified(true);
      setError("");
    } catch {
      setError("Invalid OTP");
    }
  };

  const saveUserToBackend = async (user) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName || name,
      }),
    });
  };

  const handleSignup = async () => {
    if (!otpVerified) return setError("Verify phone first");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await saveUserToBackend(userCredential.user);
      trackCompleteRegistration("email");
      navigate("/user");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf7] flex items-center justify-center px-6 py-10 font-sans">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-md p-10 rounded-2xl shadow-lg">

        {/* BRAND */}
        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl italic font-serif">ilika</h1>
          <p className="text-xs tracking-widest text-gray-400 mt-2">
            Elegant · Bright · You
          </p>
        </div>

        <h2 className="text-xl font-serif font-medium text-gray-800 mb-1">
          Create account
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Join Ilika and start your journey
        </p>

        {/* STEPPER */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div
                  className={`flex-1 h-px ${
                    i <= step ? "bg-[#b76e79]" : "bg-gray-200"
                  }`}
                />
              )}
              <div className="flex flex-col items-center text-xs">
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full transition
                  ${
                    i < step
                      ? "bg-[#b76e79] text-white"
                      : i === step
                      ? "border border-[#b76e79] text-[#b76e79]"
                      : "border border-gray-300 text-gray-400"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`mt-1 ${
                    i <= step ? "text-[#b76e79]" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* STEP 0 */}
        {step === 0 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(1); }}>

            <input
              className="w-full mb-5 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf] transition"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="w-full mb-5 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf] transition"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative mb-5">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf] transition"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                👁
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button className="w-full bg-[#b76e79] text-white py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-[#a85d67] transition mb-4">
              Continue
            </button>

            <button
              type="button"
              onClick={async () => {
                const result = await signInWithGoogle();
                await saveUserToBackend(result.user);
                navigate("/user");
              }}
              className="w-full border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Sign up with Google
            </button>
          </form>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input
              className="w-full mb-5 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf]"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div id="recaptcha-container" />

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              onClick={sendOtp}
              className="w-full bg-[#b76e79] text-white py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-[#a85d67] transition mb-3"
            >
              {sending ? "Sending..." : "Send OTP"}
            </button>

            <button
              onClick={() => setStep(0)}
              className="w-full border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Back
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input
              className="w-full mb-5 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf]"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {!otpVerified ? (
              <button
                onClick={verifyOtp}
                className="w-full bg-[#b76e79] text-white py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-[#a85d67] transition mb-3"
              >
                Verify OTP
              </button>
            ) : (
              <button
                onClick={handleSignup}
                className="w-full bg-green-600 text-white py-3 rounded-xl shadow-sm hover:shadow-md transition mb-3"
              >
                Complete Signup
              </button>
            )}
          </>
        )}

        {/* FOOTER */}
        <p className="text-center text-sm mt-6 text-gray-400">
          Already have an account?{" "}
          <span
            className="text-[#b76e79] cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;