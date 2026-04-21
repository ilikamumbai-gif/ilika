
import { createContext, useContext, useEffect, useState } from "react";

const ComboContext = createContext(null);
const COMBO_CACHE_KEY = "ilika.combos.v1";

export const ComboProvider = ({ children }) => {
  const [combos, setCombos] = useState([]);
  const API = import.meta.env.VITE_API_URL;

  const fetchCombos = async () => {
    const res = await fetch(`${API}/api/combos`);
    const data = await res.json();
    setCombos(data || []);
    sessionStorage.setItem(COMBO_CACHE_KEY, JSON.stringify(data || []));
  };

  const addCombo = async (data) => {
    await fetch(`${API}/api/combos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchCombos();
  };

  const updateCombo = async (id, data) => {
    await fetch(`${API}/api/combos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchCombos();
  };

  const deleteCombo = async (id) => {
    await fetch(`${API}/api/combos/${id}`, {
      method: "DELETE",
    });
    fetchCombos();
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(COMBO_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setCombos(parsed);
        }
      }
    } catch (error) {
      console.error("Combo cache parse error:", error);
    }

    let idleId;
    let timerId;
    const queueFetch = () => fetchCombos();

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
