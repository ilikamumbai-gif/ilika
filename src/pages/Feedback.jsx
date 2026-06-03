import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../context/AuthContext";

const parseApiResponse = async (res) => {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { data, text };
};

const inputBaseClassName =
  "w-full rounded-2xl border border-[#eadfdb] bg-white/90 px-4 py-3.5 text-sm text-[#2c2523] shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition placeholder:text-[#a08d88] focus:border-[#c97b7b] focus:ring-4 focus:ring-[#f6d9d5]";

const Field = ({ label, required = false, children, hint = "" }) => (
  <label className="block space-y-2">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-[#5c302b]">
        {label}
        {required ? <span className="text-[#b74b4b]"> *</span> : null}
      </span>
      {hint ? <span className="text-xs text-[#aa918b]">{hint}</span> : null}
    </div>
    {children}
  </label>
);

const StarRatingInput = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="rounded-[24px] border border-[#eadfdb] bg-[linear-gradient(180deg,#fffdfc_0%,#fff7f5_100%)] px-4 py-4 shadow-[0_12px_30px_rgba(188,124,124,0.08)]">
      <div className="flex flex-wrap items-center gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(value === star ? "" : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="rounded-full p-1 transition duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#f2c4bc]"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                (hovered || Number(value)) >= star
                  ? "fill-[#f4b63d] text-[#f4b63d]"
                  : "text-[#e2d8d4]"
              }`}
            />
          </button>
        ))}
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="ml-auto text-xs font-semibold text-[#9a7e77] hover:text-[#7f5b54]"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-[#9f8a84]">
        Tap a star to rate your experience.
      </p>
    </div>
  );
};

const Feedback = () => {
  const [searchParams] = useSearchParams();
  const prefilledProductName = searchParams.get("productName") || "";
  const { currentUser, userData } = useAuth();
  const API = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    productName: prefilledProductName,
    rating: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const isValid = useMemo(() => {
    return Boolean(form.name.trim() && form.productName.trim() && form.message.trim());
  }, [form.name, form.productName, form.message]);

  useEffect(() => {
    const nextName = userData?.name || currentUser?.displayName || "";
    const nextEmail = userData?.email || currentUser?.email || "";
    const nextPhone = userData?.phone || currentUser?.phoneNumber || "";

    if (!nextName && !nextEmail && !nextPhone) return;

    setForm((prev) => ({
      ...prev,
      name: prev.name || nextName,
      email: prev.email || nextEmail,
      phone: prev.phone || nextPhone,
    }));
  }, [currentUser, userData]);

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
        productName: form.productName.trim(),
        rating: form.rating ? Number(form.rating) : null,
        message: form.message.trim(),
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || form.email.trim() || null,
      };

      const res = await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        const msg = isHtmlError
          ? "Feedback service is not available yet. Please contact admin to deploy latest backend."
          : data?.error || "Failed to submit feedback";
        throw new Error(msg);
      }

      setSuccess("Thank you. Your feedback has been submitted.");
      setForm((prev) => ({
        ...prev,
        name: userData?.name || currentUser?.displayName || "",
        email: userData?.email || currentUser?.email || "",
        phone: userData?.phone || currentUser?.phoneNumber || "",
        productName: "",
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

        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="overflow-hidden rounded-[32px] border border-[#efe1dc] bg-white shadow-[0_30px_80px_rgba(67,33,23,0.08)]">
            <div className="border-b border-[#f2e7e3] bg-[radial-gradient(circle_at_top_left,_rgba(224,168,168,0.2),_transparent_38%),linear-gradient(135deg,#fffaf9_0%,#fff3f0_100%)] px-6 py-7 sm:px-8 sm:py-9">
             
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#6f1e1e] sm:text-4xl">
                Share Your FeedBack
              </h1>
             
            </div>

            <form onSubmit={submitFeedback} className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Your Name" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter your full name"
                    className={inputBaseClassName}
                  />
                </Field>
                <Field label="Email Address" hint="Optional">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="Enter your email"
                    className={inputBaseClassName}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Phone Number" hint="Optional">
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="Enter your phone number"
                    className={inputBaseClassName}
                  />
                </Field>
                <Field label="Product Name" required>
                  <input
                    type="text"
                    value={form.productName}
                    onChange={(e) => updateField("productName", e.target.value)}
                    placeholder="Enter the product name"
                    className={inputBaseClassName}
                  />
                </Field>
              </div>

              <Field label="Rating" hint="Optional">
                <StarRatingInput value={form.rating} onChange={(value) => updateField("rating", value)} />
              </Field>

              <Field label="Your Feedback" required>
                <textarea
                  rows="6"
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Write your product experience, what you liked, and anything buyers should know..."
                  className={`${inputBaseClassName} min-h-[170px] resize-none pt-4`}
                />
              </Field>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[#f2e7e3] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3f302c_0%,#6a5b56_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(63,48,44,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(63,48,44,0.22)] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Feedback;
