import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { auth } from "../firebase/firebaseConfig";

const ISSUE_TYPES = [
  { value: "order", label: "Order Issue" },
  { value: "product", label: "Product Issue" },
  { value: "delivery", label: "Delivery Issue" },
  { value: "payment", label: "Payment Issue" },
  { value: "other", label: "Other" },
];

const Feedback = () => {
  const [searchParams] = useSearchParams();
  const prefilledOrderId = searchParams.get("orderId") || "";
  const user = auth.currentUser;
  const API = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    orderId: prefilledOrderId,
    issueType: "other",
    rating: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const isValid = useMemo(() => {
    return Boolean(form.name.trim() && form.message.trim());
  }, [form.name, form.message]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        orderId: form.orderId.trim(),
        issueType: form.issueType,
        rating: form.rating ? Number(form.rating) : null,
        message: form.message.trim(),
        userId: user?.uid || null,
        userEmail: user?.email || form.email.trim() || null,
      };

      const res = await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit feedback");

      setSuccess("Thank you. Your feedback has been submitted.");
      setForm((prev) => ({
        ...prev,
        name: "",
        phone: "",
        rating: "",
        message: "",
      }));
    } catch (err) {
      setError(err?.message || "Unable to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <MiniDivider />
      <div className="primary-bg-color min-h-screen">
        <Header />
        <CartDrawer />

        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold heading-color">Give Feedback</h1>
            <p className="text-sm text-gray-500 mt-2">
              Share your issue or suggestion. Our team will review and respond quickly.
            </p>

            <form onSubmit={submitFeedback} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Your Name *"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Your Email"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Phone Number"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
            
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={form.issueType}
                  onChange={(e) => updateField("issueType", e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  {ISSUE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={form.rating}
                  onChange={(e) => updateField("rating", e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm bg-white"
                >
                  <option value="">Rating (optional)</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very Poor</option>
                </select>
              </div>

              <textarea
                rows="5"
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="Describe your issue or feedback *"
                className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Feedback;
