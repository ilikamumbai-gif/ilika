import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "firebase/auth";
import { Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import authImage from "../assets/Images/Banner 2.jpg";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  const redirectAfterLogin = () => {
    if (redirect === "checkout") navigate("/checkout");
    else navigate("/user");
  };

const setupRecaptcha = async () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );

    await window.recaptchaVerifier.render();
  }
};

 const sendOtp = async () => {
  if (!/^[6-9]\d{9}$/.test(phone)) {
    alert("Enter valid Indian phone number");
    return;
  }

  try {
    await setupRecaptcha();

    const appVerifier = window.recaptchaVerifier;

    const confirmation = await signInWithPhoneNumber(
      auth,
      `+91${phone}`,
      appVerifier
    );

    setConfirmationResult(confirmation);
    alert("OTP Sent Successfully");

  } catch (err) {
    console.error(err);

    // Reset expired token
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    alert(err.message);
  }
};

  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");

    try {
      await confirmationResult.confirm(otp);
      setOtpVerified(true);
      alert("Phone Verified Successfully");

      // Important: sign out temporary phone auth
      await auth.signOut();
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  const saveUserToBackend = async (user) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        phone: phone || null
      })
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let userCredential;

      if (isRegister) {
        if (!otpVerified) {
          return alert("Please verify phone first");
        }

        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      await saveUserToBackend(userCredential.user);
      redirectAfterLogin();

    } catch (err) {
      setError(err.message.replace("Firebase:", ""));
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const result = await signInWithGoogle();
      await saveUserToBackend(result.user);
      redirectAfterLogin();
    } catch (err) {
      setError(err.message.replace("Firebase:", ""));
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">

      {/* LEFT IMAGE */}
      <div className="hidden md:block relative">
        <img src={authImage} alt="auth" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h1 className="text-white text-4xl font-semibold">
            Welcome to Ilika
          </h1>
        </div>
      </div>

      {/* FORM */}
      <div className="flex items-center justify-center bg-[#f7f7f7] px-6 py-10">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">

          <h2 className="text-2xl font-semibold text-center mb-6">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Email address"
              className="w-full border rounded-lg px-4 py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* PASSWORD */}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full border rounded-lg px-4 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* PHONE FIELD ONLY FOR REGISTER */}
            {isRegister && (
              <>
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full border rounded-lg px-4 py-3"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={sendOtp}
                  className="w-full bg-gray-200 py-2 rounded"
                >
                  Send OTP
                </button>

                <input
                  type="text"
                  placeholder="Enter OTP"
                  className="w-full border rounded-lg px-4 py-3"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <button
                  type="button"
                  onClick={verifyOtp}
                  className="w-full bg-gray-200 py-2 rounded"
                >
                  Verify OTP
                </button>
                <div id="recaptcha-container"></div>
              </>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg"
            >
              {isRegister ? "Register" : "Login"}
            </button>
          </form>


          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <button
            onClick={handleGoogleAuth}
            className="w-full border py-3 rounded-lg"
          >
            Continue with Google
          </button>

          <p className="text-sm mt-6 text-center">
            {isRegister ? "Already have an account?" : "New here?"}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 underline"
            >
              {isRegister ? "Login" : "Create account"}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;