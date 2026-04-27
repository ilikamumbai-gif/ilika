import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MiniDivider from "../components/MiniDivider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Heading from "../components/Heading";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

/* ─── helpers ─── */
const formatDate = (value) => {
  if (!value) return "-";
  const seconds =
    typeof value === "object" && value !== null && typeof value._seconds === "number"
      ? value._seconds : null;
  const date = seconds ? new Date(seconds * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const normalizeAddress = (address = {}) => ({
  id: address.id || "",
  name: String(address.name || "").trim(),
  phone: String(address.phone || "").trim(),
  addressLine: String(address.addressLine || address.address || "").trim(),
  city: String(address.city || "").trim(),
  state: String(address.state || "").trim(),
  pincode: String(address.pincode || "").trim(),
});

const buildAddressText = (address = {}) =>
  [address.addressLine, address.city, address.state, address.pincode].filter(Boolean).join(", ");

const statusMeta = (status = "") => {
  const s = String(status || "").toLowerCase();
  if (s.includes("deliver")) return { label: "Delivered", dotCls: "bg-green-500", bgCls: "bg-green-50", textCls: "text-green-700" };
  if (s.includes("cancel"))  return { label: "Cancelled",  dotCls: "bg-red-500",   bgCls: "bg-red-50",   textCls: "text-red-700"   };
  if (s.includes("ship"))    return { label: "Shipped",    dotCls: "bg-blue-500",  bgCls: "bg-blue-50",  textCls: "text-blue-700"  };
  return { label: status || "Placed", dotCls: "bg-amber-400", bgCls: "bg-amber-50", textCls: "text-amber-700" };
};

/* ─── icons ─── */
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IconMap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconBag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg
    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

/* ─── small reusable pieces ─── */
const SectionHeader = ({ iconBgCls, iconTextCls, icon, title, right }) => (
  <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
    <div className="flex items-center gap-2.5">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgCls} ${iconTextCls}`}>
        {icon}
      </span>
      <h4 className="text-[15px] font-semibold text-gray-800 tracking-tight">{title}</h4>
    </div>
    {right}
  </div>
);

const StatCard = ({ label, value, accentCls }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
    <p className={`text-2xl font-bold ${accentCls}`}>{value}</p>
    <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-1">{label}</p>
  </div>
);

const Field = ({ label, value, onChange, type = "text" }) => (
  <label className="block">
    <span className="text-[13px] font-medium text-gray-600 mb-1.5 block">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#E7A6A1] focus:ring-2 focus:ring-[#E7A6A1]/20 transition"
    />
  </label>
);

const emptyAddressDraft = {
  name: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

/* ─── main component ─── */
const UserDetail = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: "", email: "", phone: "", createdAt: "" });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [addressDraft, setAddressDraft] = useState(emptyAddressDraft);
  const [addressBusyId, setAddressBusyId] = useState("");

  useEffect(() => { if (!currentUser) navigate("/login"); }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchAccountData = async () => {
      setLoading(true);
      try {
        const [profileRes, addressRes, orderRes] = await Promise.all([
          fetch(`${API_URL}/api/users/${currentUser.uid}`),
          fetch(`${API_URL}/api/users/${currentUser.uid}/address`),
          fetch(`${API_URL}/api/users/${currentUser.uid}/orders`),
        ]);
        const profileData = await profileRes.json().catch(() => ({}));
        const addressData = await addressRes.json().catch(() => []);
        const orderData   = await orderRes.json().catch(() => []);
        if (profileRes.ok) {
          setProfile({
            name: profileData.name || "",
            email: profileData.email || currentUser.email || "",
            phone: profileData.phone || "",
            createdAt: profileData.createdAt || "",
          });
        }
        setAddresses(Array.isArray(addressData) ? addressData.map(normalizeAddress) : []);
        setOrders(Array.isArray(orderData) ? orderData : []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAccountData();
  }, [currentUser, currentUser?.email]);

  const memberSince = useMemo(() => formatDate(profile.createdAt), [profile.createdAt]);
  const recentAddress = addresses[0] || null;

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${currentUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email, phone: profile.phone }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditingProfile(false);
    } catch { alert("Unable to save profile right now."); }
    finally { setSavingProfile(false); }
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const beginEditAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressDraft({
      name: address.name || "",
      phone: address.phone || "",
      addressLine: address.addressLine || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    });
  };

  const cancelEditAddress = () => {
    setEditingAddressId("");
    setAddressDraft(emptyAddressDraft);
  };

  const handleAddressDraftChange = (field, value) => {
    setAddressDraft((prev) => ({ ...prev, [field]: value }));
  };

  const saveAddressEdit = async (addressId) => {
    if (!currentUser?.uid || !addressId) return;
    setAddressBusyId(addressId);
    try {
      const payload = normalizeAddress(addressDraft);
      const res = await fetch(`${API_URL}/api/users/${currentUser.uid}/address/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update address");

      setAddresses((prev) =>
        prev.map((address) =>
          address.id === addressId ? { ...address, ...payload } : address
        )
      );
      cancelEditAddress();
    } catch (error) {
      console.error("Address update failed:", error);
      alert("Unable to update address right now.");
    } finally {
      setAddressBusyId("");
    }
  };

  const deleteAddress = async (addressId) => {
    if (!currentUser?.uid || !addressId) return;
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;

    setAddressBusyId(addressId);
    try {
      const res = await fetch(`${API_URL}/api/users/${currentUser.uid}/address/${addressId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete address");

      setAddresses((prev) => prev.filter((address) => address.id !== addressId));
      if (editingAddressId === addressId) cancelEditAddress();
    } catch (error) {
      console.error("Address delete failed:", error);
      alert("Unable to delete address right now.");
    } finally {
      setAddressBusyId("");
    }
  };

  return (
    <>
      <MiniDivider />
      <div className="bg-white min-h-screen">
        <Header />
        <CartDrawer />

        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Heading heading="My Account" />

            {loading ? (
              /* ── Loading state ── */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#E7A6A1] animate-spin" />
                <p className="text-sm text-gray-400">Loading your account…</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">

                {/* ══════════ SIDEBAR ══════════ */}
                <aside className="flex flex-col gap-4">

                  {/* Profile card — rose top border */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-[#E7A6A1] p-6 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E7A6A1] to-[#d4817a] text-white text-2xl font-bold flex items-center justify-center shadow-md shadow-[#E7A6A1]/30">
                      {profile.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-800">{profile.name || "User"}</h3>
                    <p className="text-sm text-gray-500 break-all mt-0.5">{profile.email || "-"}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{profile.phone || "Phone not added"}</p>
                    <span className="mt-3 inline-block text-[11px] bg-gray-50 border border-gray-100 rounded-full px-3 py-1 text-gray-400">
                      Member since {memberSince}
                    </span>

                    {!editingProfile && (
                      <div className="mt-5 flex flex-col gap-2">
                        <button
                          onClick={() => setEditingProfile(true)}
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#2B2A29] hover:bg-[#1a1918] text-white py-2.5 text-sm font-semibold transition-colors"
                        >
                          <IconEdit /> Edit Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800 py-2.5 text-sm font-medium transition-colors"
                        >
                          <IconLogout /> Logout
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Orders"    value={orders.length}    accentCls="text-violet-500" />
                    <StatCard label="Addresses" value={addresses.length} accentCls="text-teal-500"   />
                  </div>
                </aside>

                {/* ══════════ MAIN ══════════ */}
                <main className="flex flex-col gap-5">

                  {/* ── Edit Profile OR Default Address ── */}
                  {editingProfile ? (
                    /* Edit profile card — rose accent */
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-[#E7A6A1] p-6">
                      <SectionHeader
                        iconBgCls="bg-rose-50" iconTextCls="text-[#E7A6A1]"
                        icon={<IconUser />} title="Edit Profile"
                      />
                      <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
                        <Field label="Full Name" value={profile.name}  onChange={(v) => setProfile(p => ({ ...p, name: v }))} />
                        <Field label="Email"     value={profile.email} onChange={(v) => setProfile(p => ({ ...p, email: v }))} type="email" />
                        <Field label="Phone"     value={profile.phone} onChange={(v) => setProfile(p => ({ ...p, phone: v }))} />
                        <div className="flex gap-3 flex-wrap pt-1">
                          <button
                            type="submit" disabled={savingProfile}
                            className="rounded-xl bg-[#2B2A29] hover:bg-[#1a1918] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
                          >
                            {savingProfile ? "Saving…" : "Save Changes"}
                          </button>
                          <button
                            type="button" onClick={() => setEditingProfile(false)}
                            className="rounded-xl border border-gray-200 hover:border-gray-300 text-gray-600 px-6 py-2.5 text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* Default address card — teal accent */
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-teal-400 p-6">
                      <SectionHeader
                        iconBgCls="bg-teal-50" iconTextCls="text-teal-500"
                        icon={<IconMap />} title="Default Address"
                      />
                      {recentAddress ? (
                        <div className="relative rounded-xl border border-teal-100 bg-teal-50/50 p-4 overflow-hidden">
                          <span className="absolute top-3 right-3 text-[9px] font-bold tracking-widest text-teal-600 bg-teal-100 rounded-full px-2.5 py-1 uppercase">
                            Default
                          </span>
                          <p className="text-sm font-semibold text-gray-800 pr-16">{recentAddress.name || "Address"}</p>
                          <p className="text-sm text-gray-500 mt-1">{recentAddress.phone || "-"}</p>
                          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{buildAddressText(recentAddress) || "Address details missing"}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">No saved address yet. Add one at checkout for faster orders.</p>
                      )}
                    </div>
                  )}

                  {/* ── Saved Addresses — amber accent ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-amber-400 p-6">
                    <SectionHeader
                      iconBgCls="bg-amber-50" iconTextCls="text-amber-500"
                      icon={<IconMap />} title="Saved Addresses"
                      right={<span className="text-xs text-gray-300">Newest first</span>}
                    />
                    {addresses.length ? (
                      <div className="flex flex-col gap-3">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-amber-50/40 hover:border-amber-100 transition-colors p-4"
                          >
                            {editingAddressId === addr.id ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Field
                                    label="Name"
                                    value={addressDraft.name}
                                    onChange={(value) => handleAddressDraftChange("name", value)}
                                  />
                                  <Field
                                    label="Phone"
                                    value={addressDraft.phone}
                                    onChange={(value) => handleAddressDraftChange("phone", value)}
                                  />
                                  <Field
                                    label="City"
                                    value={addressDraft.city}
                                    onChange={(value) => handleAddressDraftChange("city", value)}
                                  />
                                  <Field
                                    label="State"
                                    value={addressDraft.state}
                                    onChange={(value) => handleAddressDraftChange("state", value)}
                                  />
                                  <Field
                                    label="Pincode"
                                    value={addressDraft.pincode}
                                    onChange={(value) => handleAddressDraftChange("pincode", value)}
                                  />
                                  <label className="block sm:col-span-2">
                                    <span className="text-[13px] font-medium text-gray-600 mb-1.5 block">Address</span>
                                    <textarea
                                      value={addressDraft.addressLine}
                                      onChange={(e) => handleAddressDraftChange("addressLine", e.target.value)}
                                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-[#E7A6A1] focus:ring-2 focus:ring-[#E7A6A1]/20 transition"
                                      rows={3}
                                    />
                                  </label>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => saveAddressEdit(addr.id)}
                                    disabled={addressBusyId === addr.id}
                                    className="rounded-lg bg-[#2B2A29] text-white px-4 py-2 text-xs font-semibold disabled:opacity-60"
                                  >
                                    {addressBusyId === addr.id ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditAddress}
                                    className="rounded-lg border border-gray-300 text-gray-700 px-4 py-2 text-xs font-semibold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <p className="text-sm font-semibold text-gray-800">{addr.name || "Address"}</p>
                                  <p className="text-xs text-gray-400">{addr.phone || "-"}</p>
                                </div>
                                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                                  {buildAddressText(addr) || "Address details incomplete"}
                                </p>
                                <div className="mt-3 flex gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => beginEditAddress(addr)}
                                    className="rounded-lg border border-amber-200 bg-amber-50 text-amber-700 px-3 py-1.5 text-xs font-semibold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteAddress(addr.id)}
                                    disabled={addressBusyId === addr.id}
                                    className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                                  >
                                    {addressBusyId === addr.id ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">No saved addresses found.</p>
                    )}
                  </div>

                  {/* ── Order History — violet accent ── */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-violet-400 p-6">
                    <SectionHeader
                      iconBgCls="bg-violet-50" iconTextCls="text-violet-500"
                      icon={<IconBag />} title="Order History"
                      right={
                        <Link
                          to="/"
                          className="rounded-lg bg-[#2B2A29] hover:bg-[#1a1918] text-white px-3.5 py-2 text-xs font-semibold transition-colors"
                        >
                          Continue Shopping
                        </Link>
                      }
                    />

                    {orders.length ? (
                      <div className="flex flex-col gap-4">
                        {orders.map((order) => {
                          const orderDate   = formatDate(order.createdAt);
                          const totalItems  = Array.isArray(order.items)
                            ? order.items.reduce((s, item) => s + Number(item.quantity || 1), 0) : 0;
                          const isExpanded  = expandedOrderId === order.id;
                          const shippingAddr = normalizeAddress(order.shippingAddress || {});
                          const meta = statusMeta(order.status);

                          return (
                            <article
                              key={order.id}
                              className="rounded-xl border border-gray-100 hover:border-violet-100 hover:shadow-sm transition-all p-4 bg-gray-50/40"
                            >
                              {/* Top row */}
                              <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">Order #{order.id?.slice(-8)}</p>
                                  <p className="text-xs text-gray-400 mt-1">Placed on {orderDate}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.bgCls} ${meta.textCls}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dotCls}`} />
                                    {meta.label}
                                  </span>
                                  <p className="text-base font-bold text-gray-800">{formatCurrency(order.totalAmount)}</p>
                                </div>
                              </div>

                              {/* Bottom row */}
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-gray-400">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(prev => prev === order.id ? "" : order.id)}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-1.5 transition-colors"
                                >
                                  {isExpanded ? "Hide" : "Details"} <IconChevron open={isExpanded} />
                                </button>
                              </div>

                              {/* Expanded detail */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                  {/* Items list */}
                                  <div className="flex flex-col gap-2.5">
                                    {(order.items || []).map((item, idx) => (
                                      <div key={`${order.id}-${idx}`} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
                                        <img
                                          src={item.image || item.images?.[0] || ""}
                                          alt={item.name || "Item"}
                                          className="w-14 h-14 rounded-lg border border-gray-100 object-cover bg-gray-50 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-800 truncate">{item.name || "Product"}</p>
                                          <p className="text-xs text-gray-400 mt-0.5">
                                            Qty {item.quantity || 1}{item.variantLabel ? ` · ${item.variantLabel}` : ""}
                                          </p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 ml-auto flex-shrink-0">{formatCurrency(item.price)}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Info tiles */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                                    {[
                                      { label: "Shipping Address", val: buildAddressText(shippingAddr) || "Not available" },
                                      { label: "Payment Status",   val: order.paymentStatus || "Pending" },
                                      { label: "Order Source",     val: order.source || "WEBSITE" },
                                      { label: "Order ID",         val: order.id || "-" },
                                    ].map(({ label, val }) => (
                                      <div key={label} className="rounded-xl border border-gray-100 bg-violet-50/30 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                                        <p className="text-sm font-medium text-gray-700 mt-1 break-all">{val}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-6">No orders yet. Start shopping!</p>
                    )}
                  </div>

                </main>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default UserDetail;
