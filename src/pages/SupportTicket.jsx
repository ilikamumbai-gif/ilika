import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../context/AuthContext";
import { storage } from "../firebase/firebaseConfig";
import { useProducts } from "../admin/context/ProductContext";
import { useCategories } from "../admin/context/CategoryContext";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

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
  "w-full rounded-2xl border border-[#eadfdb] bg-white/95 px-4 py-3.5 text-sm text-[#2c2523] shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition placeholder:text-[#a08d88] focus:border-[#c97b7b] focus:ring-4 focus:ring-[#f6d9d5]";

const selectBaseClassName =
  `${inputBaseClassName} appearance-none bg-[linear-gradient(180deg,#fffdfc_0%,#fff7f5_100%)]`;

const Field = ({ label, required = false, children, hint = "" }) => (
  <label className="block space-y-2">
    <span className="text-sm font-semibold text-[#5c302b]">
      {label}
      {required ? <span className="text-[#b74b4b]"> *</span> : null}
    </span>
    {children}
    {hint ? <p className="text-xs text-[#9f8a84]">{hint}</p> : null}
  </label>
);

const initialForm = {
  ticketType: "complaint",
  name: "",
  phone: "",
  email: "",
  productTypeId: "",
  productTypeName: "",
  modelId: "",
  modelName: "",
  purchaseDate: "",
  invoiceUrl: "",
  invoiceName: "",
  state: "",
  city: "",
  pincode: "",
  issueSummary: "",
  issueDetails: "",
};

const TYPE_META = {
  complaint: {
    title: "Raise a Complaint",
    subtitle:
      "Tell us what went wrong and our support team will review your complaint and get back to you quickly.",
    invoiceHint: "Upload invoice, packaging, or product issue image if available.",
    summaryLabel: "Complaint Subject",
    summaryPlaceholder: "Example: Product stopped working after first use",
    detailsLabel: "Describe Your Complaint",
    detailsPlaceholder:
      "Please share what happened, when it started, and what kind of help you need from us.",
  },
  warranty_claim: {
    title: "Submit a Warranty Claim",
    subtitle:
      "Share your warranty claim details below and our team will verify the product and invoice information.",
    invoiceHint: "Upload invoice image or PDF for warranty verification.",
    summaryLabel: "Claim Subject",
    summaryPlaceholder: "Example: Device is not turning on",
    detailsLabel: "Describe the Product Issue",
    detailsPlaceholder:
      "Explain the issue clearly, when it started, and anything you have already tried.",
  },
};

const SupportTicket = () => {
  const API = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser, userData } = useAuth();
  const { products = [], fetchProducts } = useProducts();
  const { categories = [], fetchCategories } = useCategories();

  const [form, setForm] = useState(initialForm);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pincodeLookupState, setPincodeLookupState] = useState("idle");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts?.();
    fetchCategories?.();
  }, [fetchProducts, fetchCategories]);

  useEffect(() => {
    const nextName = userData?.name || currentUser?.displayName || "";
    const nextEmail = userData?.email || currentUser?.email || "";
    const nextPhone = userData?.phone || currentUser?.phoneNumber || "";

    if (!nextName && !nextEmail && !nextPhone) return;

    setForm((prev) => ({
      ...prev,
      name: prev.name || nextName,
      email: prev.email || nextEmail,
      phone: prev.phone || nextPhone.replace(/^\+91/, ""),
    }));
  }, [currentUser, userData]);

  useEffect(() => {
    const queryType = searchParams.get("type");
    const pathType = location.pathname === "/warranty-claim" ? "warranty_claim" : "complaint";
    const nextType = queryType === "warranty_claim" || queryType === "complaint" ? queryType : pathType;
    setForm((prev) => (prev.ticketType === nextType ? prev : { ...prev, ticketType: nextType }));
  }, [location.pathname, searchParams]);

  const activeProducts = useMemo(
    () => (Array.isArray(products) ? products.filter((item) => item?.isActive !== false) : []),
    [products]
  );

  const productTypeOptions = useMemo(() => {
    const usedCategoryIds = new Set(
      activeProducts.flatMap((item) => (Array.isArray(item?.categoryIds) ? item.categoryIds : []))
    );

    return categories.filter(
      (category) =>
        usedCategoryIds.has(category?.id) &&
        String(category?.name || "").trim().toLowerCase() !== "new"
    );
  }, [activeProducts, categories]);

  const modelOptions = useMemo(() => {
    if (!form.productTypeId) return [];
    return activeProducts.filter((item) =>
      Array.isArray(item?.categoryIds) && item.categoryIds.includes(form.productTypeId)
    );
  }, [activeProducts, form.productTypeId]);

  useEffect(() => {
    const prefilledProductId = searchParams.get("productId") || "";
    const prefilledProductName = searchParams.get("productName") || "";
    if (!prefilledProductId && !prefilledProductName) return;
    if (!activeProducts.length || !productTypeOptions.length) return;

    const matchedProduct =
      activeProducts.find(
        (item) =>
          String(item?.id || item?._id || "").trim() === prefilledProductId ||
          String(item?.name || "").trim().toLowerCase() === prefilledProductName.trim().toLowerCase()
      ) || null;

    if (!matchedProduct) return;

    const matchedType = productTypeOptions.find((category) =>
      Array.isArray(matchedProduct?.categoryIds) && matchedProduct.categoryIds.includes(category.id)
    );

    setForm((prev) => {
      if (prev.modelId || prev.modelName) return prev;
      return {
        ...prev,
        productTypeId: matchedType?.id || prev.productTypeId,
        productTypeName: matchedType?.name || prev.productTypeName,
        modelId: String(matchedProduct?.id || matchedProduct?._id || ""),
        modelName: String(matchedProduct?.name || ""),
      };
    });
  }, [activeProducts, productTypeOptions, searchParams]);

  useEffect(() => {
    const trimmedPincode = String(form.pincode || "").trim();

    if (trimmedPincode.length !== 6) {
      setPincodeLookupState("idle");
      return;
    }

    let cancelled = false;

    const fetchLocationByPincode = async () => {
      try {
        setPincodeLookupState("loading");

        const res = await fetch(`https://api.postalpincode.in/pincode/${trimmedPincode}`);
        const data = await res.json();
        const result = Array.isArray(data) ? data[0] : null;
        const firstOffice = Array.isArray(result?.PostOffice) ? result.PostOffice[0] : null;

        if (!res.ok || result?.Status !== "Success" || !firstOffice) {
          throw new Error("Unable to find location for this pincode");
        }

        if (cancelled) return;

        setForm((prev) => ({
          ...prev,
          state: firstOffice.State || prev.state,
          city: firstOffice.District || firstOffice.Block || prev.city,
        }));
        setPincodeLookupState("success");
      } catch {
        if (cancelled) return;
        setPincodeLookupState("error");
      }
    };

    fetchLocationByPincode();

    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

  const currentTypeMeta = TYPE_META[form.ticketType] || TYPE_META.complaint;
  const attachmentRequired = form.ticketType === "warranty_claim";

  const isValid = useMemo(() => {
    return Boolean(
      form.name.trim() &&
      form.phone.trim() &&
      form.email.trim() &&
      form.productTypeId &&
      form.modelId &&
      form.purchaseDate &&
      form.state &&
      form.city.trim() &&
      form.pincode.trim() &&
      form.issueSummary.trim() &&
      form.issueDetails.trim() &&
      (!attachmentRequired || attachmentFile || form.invoiceUrl)
    );
  }, [attachmentFile, attachmentRequired, form]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTypeChange = (ticketType) => {
    setForm((prev) => ({
      ...prev,
      ticketType,
      invoiceUrl: ticketType === "complaint" ? prev.invoiceUrl : prev.invoiceUrl,
      invoiceName: ticketType === "complaint" ? prev.invoiceName : prev.invoiceName,
    }));
    setSuccess("");
    setError("");
  };

  const handleProductTypeChange = (nextTypeId) => {
    const selectedType = productTypeOptions.find((category) => category.id === nextTypeId);
    setForm((prev) => ({
      ...prev,
      productTypeId: nextTypeId,
      productTypeName: selectedType?.name || "",
      modelId: "",
      modelName: "",
    }));
  };

  const handleModelChange = (nextModelId) => {
    const selectedModel = modelOptions.find(
      (item) => String(item?.id || item?._id || "") === String(nextModelId)
    );
    setForm((prev) => ({
      ...prev,
      modelId: String(nextModelId || ""),
      modelName: selectedModel?.name || "",
    }));
  };

  const uploadAttachment = async () => {
    if (!attachmentFile) {
      return {
        invoiceUrl: form.invoiceUrl || "",
        invoiceName: form.invoiceName || "",
      };
    }

    const fileName = `${Date.now()}-${attachmentFile.name}`;
    const storageRef = ref(storage, `support-tickets/${fileName}`);
    await uploadBytes(storageRef, attachmentFile);
    const invoiceUrl = await getDownloadURL(storageRef);

    return {
      invoiceUrl,
      invoiceName: attachmentFile.name,
    };
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      const attachment = await uploadAttachment();

      const payload = {
        ticketType: form.ticketType,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        productTypeId: form.productTypeId,
        productTypeName: form.productTypeName,
        modelId: form.modelId,
        modelName: form.modelName,
        productId: form.modelId,
        productName: form.modelName,
        purchaseDate: form.purchaseDate,
        invoiceUrl: attachment.invoiceUrl || null,
        invoiceName: attachment.invoiceName || null,
        state: form.state,
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        issueSummary: form.issueSummary.trim(),
        issueDetails: form.issueDetails.trim(),
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || form.email.trim() || null,
      };

      const res = await fetch(`${API}/api/support-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        const message = isHtmlError
          ? "Support service is not available yet. Please contact support."
          : data?.error || "Failed to submit support request";
        throw new Error(message);
      }

      setSuccess(
        form.ticketType === "warranty_claim"
          ? "Warranty claim submitted successfully."
          : "Complaint submitted successfully."
      );
      setAttachmentFile(null);
      setForm((prev) => ({
        ...initialForm,
        ticketType: prev.ticketType,
        name: userData?.name || currentUser?.displayName || "",
        email: userData?.email || currentUser?.email || "",
        phone: (userData?.phone || currentUser?.phoneNumber || "").replace(/^\+91/, ""),
      }));
    } catch (err) {
      setError(err?.message || "Unable to submit support request.");
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

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="overflow-hidden rounded-[32px] border border-[#efe1dc] bg-white shadow-[0_30px_80px_rgba(67,33,23,0.08)]">
            <div className="border-b border-[#f2e7e3] bg-[radial-gradient(circle_at_top_left,_rgba(224,168,168,0.2),_transparent_38%),linear-gradient(135deg,#fffaf9_0%,#fff3f0_100%)] px-6 py-7 sm:px-8 sm:py-9">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b17272]">
                Ilika Support
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#6f1e1e] sm:text-4xl">
                {currentTypeMeta.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7a5d58] sm:text-base">
                {currentTypeMeta.subtitle}
              </p>
            </div>

            <form onSubmit={submitTicket} className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
              <div className="rounded-[28px] border border-[#f1e4df] bg-[#fff8f6] p-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    { value: "complaint", label: "Raise Complaint" },
                    { value: "warranty_claim", label: "Warranty Claim" },
                  ].map((option) => {
                    const active = form.ticketType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleTypeChange(option.value)}
                        className={`rounded-2xl px-5 py-4 text-left transition ${
                          active
                            ? "bg-[linear-gradient(135deg,#7a3535_0%,#c77b61_100%)] text-white shadow-[0_10px_24px_rgba(122,53,53,0.18)]"
                            : "bg-white text-[#6f1e1e] hover:bg-[#fff1ed]"
                        }`}
                      >
                        <p className="text-base font-semibold">{option.label}</p>
                        <p className={`mt-1 text-xs leading-5 ${active ? "text-white/85" : "text-[#8b6f69]"}`}>
                          {option.value === "complaint"
                            ? "Report a product or service issue."
                            : "Submit a product warranty claim for review."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Field label="Full Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Type here"
                  className={inputBaseClassName}
                />
              </Field>

              <Field label="Mobile Number" required>
                <div className="flex overflow-hidden rounded-2xl border border-[#eadfdb] bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <span className="flex items-center border-r border-[#eadfdb] bg-[#fff7f5] px-4 text-sm font-medium text-[#866862]">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Type here"
                    className="w-full px-4 py-3.5 text-sm text-[#2c2523] outline-none placeholder:text-[#a08d88]"
                  />
                </div>
              </Field>

              <Field label="Your Email Address" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Type here"
                  className={inputBaseClassName}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Category" required>
                  <select
                    value={form.productTypeId}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    className={selectBaseClassName}
                  >
                    <option value="">Select Category</option>
                    {productTypeOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Product Name" required>
                  <select
                    value={form.modelId}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className={selectBaseClassName}
                    disabled={!form.productTypeId}
                  >
                    <option value="">Select Product</option>
                    {modelOptions.map((item) => (
                      <option key={item.id || item._id} value={item.id || item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={currentTypeMeta.summaryLabel} required>
                <input
                  type="text"
                  value={form.issueSummary}
                  onChange={(e) => updateField("issueSummary", e.target.value)}
                  placeholder={currentTypeMeta.summaryPlaceholder}
                  className={inputBaseClassName}
                />
              </Field>

              <Field label="Please select the date of purchase" required>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => updateField("purchaseDate", e.target.value)}
                  className={inputBaseClassName}
                />
              </Field>

              <Field
                label={form.ticketType === "warranty_claim" ? "Please upload your purchase invoice" : "Please upload invoice or supporting file"}
                required={attachmentRequired}
                hint={currentTypeMeta.invoiceHint}
              >
                <div className="rounded-2xl border border-dashed border-[#dcc9c4] bg-[#fffaf9] px-4 py-4">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAttachmentFile(file);
                      if (file) {
                        setForm((prev) => ({
                          ...prev,
                          invoiceName: file.name,
                          invoiceUrl: "",
                        }));
                      }
                    }}
                    className="block w-full text-sm text-[#6c5852] file:mr-4 file:rounded-xl file:border-0 file:bg-[#f6d9d5] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#7a3535] hover:file:bg-[#f0c8c3]"
                  />
                </div>
              </Field>

              <Field label="Pincode" required>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter your pincode"
                    className={inputBaseClassName}
                  />
                  {pincodeLookupState === "loading" ? (
                    <p className="text-xs text-[#9a8883]">Checking state and city...</p>
                  ) : null}
                  {pincodeLookupState === "success" ? (
                    <p className="text-xs text-emerald-700">State and city filled from pincode.</p>
                  ) : null}
                  {pincodeLookupState === "error" ? (
                    <p className="text-xs text-red-600">Could not auto-fill location for this pincode.</p>
                  ) : null}
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="State" required>
                  <select
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className={selectBaseClassName}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="City" required>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="City"
                    className={inputBaseClassName}
                  />
                </Field>
              </div>

              <Field label={currentTypeMeta.detailsLabel} required>
                <textarea
                  rows="6"
                  value={form.issueDetails}
                  onChange={(e) => updateField("issueDetails", e.target.value)}
                  placeholder={currentTypeMeta.detailsPlaceholder}
                  className={`${inputBaseClassName} resize-none`}
                />
              </Field>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-[#f2e7e3] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={!isValid || submitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7a3535_0%,#c77b61_100%)] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(122,53,53,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(122,53,53,0.24)] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto"
                >
                  {submitting
                    ? "Submitting..."
                    : form.ticketType === "warranty_claim"
                      ? "Submit Warranty Claim"
                      : "Submit Complaint"}
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

export default SupportTicket;
