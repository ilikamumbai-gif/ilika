import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { auth } from "../firebase/firebaseConfig";

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

const WarrantyRegistration = () => {
  const [searchParams] = useSearchParams();
  const API = import.meta.env.VITE_API_URL;
  const user = auth.currentUser;

  const [form, setForm] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    productId: searchParams.get("productId") || "",
    productName: searchParams.get("productName") || "",
    purchaseDate: "",
    city: "",
    address: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const isValid = useMemo(() => {
    return Boolean(
      form.name.trim() &&
      form.phone.trim() &&
      form.productName.trim() &&
      form.purchaseDate &&
      form.address.trim()
    );
  }, [form]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitWarranty = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        productId: form.productId.trim() || null,
        productName: form.productName.trim(),
        purchaseDate: form.purchaseDate,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        userId: user?.uid || null,
        userEmail: user?.email || form.email.trim() || null,
      };

      const res = await fetch(`${API}/api/warranty-registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        const msg = isHtmlError
          ? "Warranty service is not available yet. Please contact support."
          : data?.error || "Failed to register warranty";
        throw new Error(msg);
      }

      setSuccess("Warranty registration submitted successfully.");
      setForm((prev) => ({
        ...prev,
        phone: "",
        purchaseDate: "",
        city: "",
        address: "",
      }));
    } catch (err) {
      setError(err?.message || "Unable to submit warranty registration.");
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
            <h1 className="text-2xl sm:text-3xl font-semibold heading-color">
              Import Product Warranty Registration
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Register your imported product warranty. Our support team will verify and confirm.
            </p>

            <form onSubmit={submitWarranty} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Full Name *"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Email"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Phone Number *"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                  placeholder="Product Name *"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => updateField("purchaseDate", e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City (optional)"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <textarea
                rows="4"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Address *"
                className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Register Warranty"}
              </button>
            </form>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default WarrantyRegistration;
