import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { markCurrentPageAsLastVisited, trackVisitorEvent } from "../../utils/visitorAnalytics";

const AdminLogin = () => {
  const { admin, authReady, login, loginWithGoogle } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackVisitorEvent({
      eventType: "page_view",
      pageUrl: typeof window !== "undefined" ? window.location.href : "/admin/login",
    });
    markCurrentPageAsLastVisited();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const success = await login(form.username, form.password);
    if (success) {
      trackVisitorEvent({
        eventType: "login",
        pageUrl: typeof window !== "undefined" ? window.location.href : "/admin/login",
      });
      markCurrentPageAsLastVisited();
      navigate("/admin");
    } else {
      setError("Invalid username or password");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const result = await loginWithGoogle();
    if (result === true) {
      trackVisitorEvent({
        eventType: "login",
        pageUrl: typeof window !== "undefined" ? window.location.href : "/admin/login",
      });
      markCurrentPageAsLastVisited();
      navigate("/admin");
    } else {
      setError(result || "Google login failed");
    }
    setLoading(false);
  };

  if (authReady && admin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0D0D0D" }}>
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#E91E8C,transparent)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#FF6B35,transparent)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
              <span className="text-white font-black text-lg">IL</span>
            </div>
            <h1 className="text-xl font-bold text-white">Ilika Admin</h1>
            <p className="text-sm mt-1" style={{ color: "#666" }}>Sign in to your panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Username or Email</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter username or email"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full h-11 pl-9 pr-3 text-sm rounded-xl transition focus:outline-none"
                  style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#888" }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }} />
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full h-11 pl-9 pr-10 text-sm rounded-xl transition focus:outline-none"
                  style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-bold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "#2A2A2A" }} />
            <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "#666" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#2A2A2A" }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 px-4 text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-3"
            style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-4 h-4"
            />
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: "#444" }}>
          © 2025 Ilika Beauty. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
