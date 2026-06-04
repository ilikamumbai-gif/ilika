import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_URL, getApiUrl, handleApiError, readSessionCache, writeSessionCache } from "../../utils/api";

const BannerContext = createContext(null);
const BANNER_CACHE_KEY = "ilika.banners.v1";

export const BannerProvider = ({ children }) => {
  const [banners, setBanners] = useState(() => readSessionCache(BANNER_CACHE_KEY, []));

  const fetchBanners = async () => {
    if (!API_URL) {
      handleApiError("Banners", new Error("VITE_API_URL is missing"));
      return banners;
    }

    try {
      const res = await fetch(getApiUrl("/api/banners"));
      if (!res.ok) throw new Error("Failed to fetch banners");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setBanners(list);
      writeSessionCache(BANNER_CACHE_KEY, list);
      return list;
    } catch (error) {
      handleApiError("Banners", error);
      const cached = readSessionCache(BANNER_CACHE_KEY, []);
      setBanners(cached);
      return cached;
    }
  };

  useEffect(() => {
    let idleId;
    let timerId;
    const queueFetch = () => {
      fetchBanners();
    };

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

  const addBanner = async (payload) => {
    const res = await fetch(getApiUrl("/api/banners"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to add banner");
    }

    await fetchBanners();
  };

  const updateBanner = async (id, payload) => {
    const res = await fetch(getApiUrl(`/api/banners/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update banner");
    }

    await fetchBanners();
  };

  const deleteBanner = async (id) => {
    const res = await fetch(getApiUrl(`/api/banners/${id}`), { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete banner");
    await fetchBanners();
  };

  const activeBanners = useMemo(
    () => banners.filter((banner) => banner?.isActive !== false),
    [banners]
  );

  return (
    <BannerContext.Provider
      value={{
        banners,
        activeBanners,
        fetchBanners,
        addBanner,
        updateBanner,
        deleteBanner,
      }}
    >
      {children}
    </BannerContext.Provider>
  );
};

export const useBanners = () => {
  const ctx = useContext(BannerContext);
  if (!ctx) throw new Error("useBanners must be used inside BannerProvider");
  return ctx;
};

export const useOptionalBanners = () => {
  return useContext(BannerContext);
};
