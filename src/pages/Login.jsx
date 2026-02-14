import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

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
      navigate("/user");

    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");

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
          {isRegister ? "Register" : "Login"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded"
          >
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        {/* 🔥 GOOGLE BUTTON */}
        <button
          onClick={handleGoogleAuth}
          className="w-full mt-4 border py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition"
        >
          Continue with Google
        </button>

        <p className="text-sm mt-4 text-center">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="ml-2 underline"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
