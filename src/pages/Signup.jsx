import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { app } from "../firebase/firebaseConfig";


const Signup = () => {
  const auth = getAuth(app);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");


  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);


  const setupRecaptcha = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
      },
      auth
    );
  };
  const sendOtp = async () => {
    if (!phone) {
      alert("Phone number is required");
      return;
    }

    setupRecaptcha();

    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        appVerifier
      );
      setConfirmationResult(result);
      alert("OTP Sent Successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to send OTP");
    }
  };
  const verifyOtp = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    try {
      await confirmationResult.confirm(otp);
      setOtpVerified(true);
      alert("Phone Verified Successfully");
    } catch (error) {
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
        name: user.displayName || name
      })
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      alert("Please verify phone number first");
      return;
    }
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await saveUserToBackend(userCredential.user);
      navigate("/user");

    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithGoogle();
      await saveUserToBackend(result.user);
      navigate("/user");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Create Account
        </h2>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <button type="button" onClick={sendOtp}>
            Send OTP
          </button>

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button type="button" onClick={verifyOtp}>
            Verify OTP
          </button>

          <div id="recaptcha-container"></div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded"
          >
            Sign Up
          </button>
        </form>

        {/* 🔥 GOOGLE BUTTON */}
        <button
          onClick={handleGoogleSignup}
          className="w-full mt-4 border py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition"
        >
          Sign up with Google
        </button>

        <p className="text-sm mt-4 text-center">
          Already have an account?
          <button
            onClick={() => navigate("/login")}
            className="ml-2 underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
