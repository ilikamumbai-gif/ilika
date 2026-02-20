import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import authImage from "../assets/Images/Banner 2.jpg";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
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
        name: user.displayName || user.email.split("@")[0]
      })
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
      setError(err.message.replace("Firebase:", ""));
    }
  };

  const handleGoogleAuth = async () => {
    setError("");

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
        <img
          src={authImage}
          alt="auth"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <h1 className="text-white text-4xl font-semibold tracking-wide">
            Welcome to Ilika
          </h1>
        </div>
      </div>

      {/* FORM */}
      <div className="flex items-center justify-center bg-[#f7f7f7] px-6 py-10">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl p-8">

          <h2 className="text-2xl font-semibold text-center mb-6">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full border rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-black/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              {isRegister ? "Register" : "Login"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* GOOGLE BUTTON */}
          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 border py-3 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          {/* TOGGLE */}
          <p className="text-sm mt-6 text-center">
            {isRegister ? "Already have an account?" : "New here?"}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 font-medium underline"
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