import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { getApiUrl } from "../../utils/api";

const CartEventContext = createContext();

export const useCartEvents = () => useContext(CartEventContext);

export const CartEventProvider = ({ children }) => {

  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(getApiUrl("/api/cart-events"));
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch cart events", error);
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <CartEventContext.Provider value={{ events, fetchEvents }}>
      {children}
    </CartEventContext.Provider>
  );
};
