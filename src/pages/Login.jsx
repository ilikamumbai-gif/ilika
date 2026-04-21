import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import authImage from "../assets/Images/Banner 2.webp";
import logo from "/Images/logo2.webp";
import { Eye, EyeOff } from "lucide-react"; // ✅ ICONS

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  const redirectAfterLogin = () => {
    if (redirect === "checkout") navigate("/checkout");
    else navigate("/user");
  };

  const saveUserToBackend = async (user) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: name || "",
        phone: null,
      }),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      await saveUserToBackend(userCredential.user);
      redirectAfterLogin();
    } catch (err) {
      setError(err.message.replace("Firebase:", "").trim());
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithGoogle();
      await saveUserToBackend(result.user);
      redirectAfterLogin();
    } catch (err) {
      setError(err.message.replace("Firebase:", "").trim());
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans bg-[#fdfaf7]">

      {/* LEFT IMAGE */}
      <div className="hidden md:block relative">
        <img src={authImage} alt="auth" className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/20 to-white/50 flex flex-col justify-end p-18 text-white">

          {/* ✅ FIXED LOGO (bigger + cleaner, no duplication feel) */}
          <img
            src={logo}
            alt="brand"
            fetchpriority="high"
           className="w-48 mb-6 object-contain drop-shadow-[0_4px_20px_rgba(255,255,255,0.35)] contrast-125 brightness-110"
          />

          <div className="w-12 h-px bg-white/40 mb-6" />

          <h2 className="text-3xl font-serif mb-2 text-black">
            Beauty that speaks for itself
          </h2>

          <p className="text-sm text-black/80 max-w-sm leading-relaxed">
            Skincare and beauty tools crafted with care, for every skin type.
          </p>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-lg">

          {/* ✅ MOBILE LOGO (slightly bigger) */}
          <div className="md:hidden text-center mb-8">
            <img
              src={logo}
              alt="brand"
              fetchpriority="high"
              className="w-32 mx-auto object-contain"
            />
          </div>

          {/* HEADER */}
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-medium tracking-wide text-gray-800">
              {isRegister ? "Create an account" : "Welcome back"}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isRegister
                ? "Join Ilika and start your beauty journey"
                : "Sign in to continue"}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>

            {isRegister && (
              <input
                className="w-full mb-5 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf] transition"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <input
              className="w-full mb-5 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf] transition"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* ✅ PASSWORD WITH ICON */}
            <div className="relative mb-5">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#e8cfcf]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <button className="w-full bg-[#b76e79] text-white py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-[#a85d67] transition mb-4">
              {isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 mb-6 opacity-60">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-400 uppercase">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* ✅ GOOGLE BUTTON WITH ICON */}
          <button
            onClick={handleGoogleAuth}
            className="w-full border border-gray-200 py-3 rounded-xl flex justify-center items-center gap-3 hover:bg-gray-50 transition mb-6"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-400">
            {isRegister ? "Already have an account?" : "New to Ilika?"}
            <span
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-[#b76e79] ml-2 cursor-pointer hover:underline"
            >
              {isRegister ? "Sign In" : "Create Account"}
            </span>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;