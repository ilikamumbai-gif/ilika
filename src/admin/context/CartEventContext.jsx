import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../../../Backend/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const CartEventContext = createContext();

export const useCartEvents = () => useContext(CartEventContext);

export const CartEventProvider = ({ children }) => {

  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {

    const snap = await getDocs(collection(db, "cartEvents"));

    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <CartEventContext.Provider value={{ events }}>
      {children}
    </CartEventContext.Provider>
  );
};