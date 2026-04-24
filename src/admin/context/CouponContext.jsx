import React, { createContext, useContext, useEffect, useState } from "react";

const CouponContext = createContext(null);
const COUPON_CACHE_KEY = "ilika.coupons.v1";

const normalizeCode = (value = "") =>
  String(value || "").trim();

export const CouponProvider = ({ children }) => {
  const [coupons, setCoupons] = useState([]);
  const API = import.meta.env.VITE_API_URL;

  const fetchCoupons = async () => {
    const res = await fetch(`${API}/api/coupons`);
    if (!res.ok) throw new Error("Failed to fetch coupons");
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setCoupons(list);
    sessionStorage.setItem(COUPON_CACHE_KEY, JSON.stringify(list));
    return list;
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(COUPON_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setCoupons(parsed);
      }
    } catch (error) {
      console.error("Coupon cache parse error:", error);
    }

    let idleId;
    let timerId;
    const queueFetch = () => fetchCoupons().catch((err) => console.error(err));

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(queueFetch, { timeout: 2000 });
    } else {
      timerId = window.setTimeout(queueFetch, 900);
    }

    return () => {
      if (idleId) window.cancelIdleCallback?.(idleId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  const addCoupon = async (payload) => {
    const res = await fetch(`${API}/api/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload?.name || "",
        code: normalizeCode(payload?.code),
        discountPercent: Number(payload?.discountPercent || 0),
        isActive: payload?.isActive ?? true,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to add coupon");
    }

    await fetchCoupons();
  };

  const updateCoupon = async (id, payload) => {
    const res = await fetch(`${API}/api/coupons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload?.name || "",
        code: normalizeCode(payload?.code),
        discountPercent: Number(payload?.discountPercent || 0),
        isActive: payload?.isActive ?? true,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update coupon");
    }

    await fetchCoupons();
  };

  const deleteCoupon = async (id) => {
    const res = await fetch(`${API}/api/coupons/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete coupon");
    await fetchCoupons();
  };

  return (
    <CouponContext.Provider
      value={{
        coupons,
        fetchCoupons,
        addCoupon,
        updateCoupon,
        deleteCoupon,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupons = () => {
  const ctx = useContext(CouponContext);
  if (!ctx) throw new Error("useCoupons must be used inside CouponProvider");
  return ctx;
};
