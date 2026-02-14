import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
