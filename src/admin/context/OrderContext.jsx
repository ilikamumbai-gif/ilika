import { createContext, useContext, useEffect, useState } from "react";

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL;

  // Universal Firestore Date Parser
  const parseDate = (createdAt) => {
    if (!createdAt) return "-";

    // Firestore Timestamp
    if (createdAt?._seconds)
      return new Date(createdAt._seconds * 1000).toLocaleDateString();

    // JS Date
    return new Date(createdAt).toLocaleDateString();
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/api/orders`);
        const data = await res.json();

        const formatted = data.map((o) => ({
          id: o.id || "",
          userEmail: o.userEmail || "guest@email.com",
          total: o.totalAmount || 0,
          status: o.status || "Placed",
          date: parseDate(o.createdAt),
          items: o.items || [],
          shippingAddress: o.shippingAddress || {},
        }));

        setOrders(formatted);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getOrderById = (id) =>
    orders.find((o) => String(o.id) === String(id));

  return (
    <OrderContext.Provider value={{ orders, loading, getOrderById }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
