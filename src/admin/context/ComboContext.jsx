
import { createContext, useContext, useEffect, useState } from "react";
import { API_URL, getApiUrl, handleApiError, readSessionCache, writeSessionCache } from "../../utils/api";

const ComboContext = createContext(null);
const COMBO_CACHE_KEY = "ilika.combos.v1";

export const ComboProvider = ({ children }) => {
  const [combos, setCombos] = useState(() => readSessionCache(COMBO_CACHE_KEY, []));

  const fetchCombos = async () => {
    if (!API_URL) {
      handleApiError("Combos", new Error("VITE_API_URL is missing"));
      return combos;
    }

    try {
      const res = await fetch(getApiUrl("/api/combos"));
      if (!res.ok) throw new Error("Failed to fetch combos");

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setCombos(list);
      writeSessionCache(COMBO_CACHE_KEY, list);
      return list;
    } catch (error) {
      handleApiError("Combos", error);
      const cached = readSessionCache(COMBO_CACHE_KEY, []);
      setCombos(cached);
      return cached;
    }
  };

  const addCombo = async (data) => {
    await fetch(getApiUrl("/api/combos"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchCombos();
  };

  const updateCombo = async (id, data) => {
    await fetch(getApiUrl(`/api/combos/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchCombos();
  };

  const deleteCombo = async (id) => {
    await fetch(getApiUrl(`/api/combos/${id}`), {
      method: "DELETE",
    });
    await fetchCombos();
  };

  useEffect(() => {
    let idleId;
    let timerId;
    const queueFetch = () => {
      fetchCombos();
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(queueFetch, { timeout: 2200 });
    } else {
      timerId = window.setTimeout(queueFetch, 1000);
    }

    return () => {
      if (idleId) window.cancelIdleCallback?.(idleId);
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  return (
    <ComboContext.Provider
      value={{ combos, fetchCombos, addCombo, updateCombo, deleteCombo }}
    >
      {children}
    </ComboContext.Provider>
  );
};

export const useCombos = () => {
  return useContext(ComboContext);
};
