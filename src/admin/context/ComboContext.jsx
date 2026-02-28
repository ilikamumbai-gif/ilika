import { createContext, useContext, useEffect, useState } from "react";

const ComboContext = createContext(null);

export const ComboProvider = ({ children }) => {
  const [combos, setCombos] = useState([]);
  const API = import.meta.env.VITE_API_URL;

  const fetchCombos = async () => {
    const res = await fetch(`${API}/api/combos`);
    const data = await res.json();
    setCombos(data || []);
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
    fetchCombos();
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