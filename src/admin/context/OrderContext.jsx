import { createContext, useContext, useEffect, useState } from "react";

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL;

  /* ================= PARSE DATE ================= */
  const parseDate = (createdAt) => {
    if (!createdAt) return "-";

    if (createdAt?._seconds)
      return new Date(createdAt._seconds * 1000).toLocaleDateString();

    return new Date(createdAt).toLocaleDateString();
  };

  /* ================= FETCH ORDERS ================= */
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/orders`);
      const data = await res.json();

      const formatted = data.map((o) => ({
        id: o.id,
        userEmail: o.userEmail || "guest@email.com",
        total: o.totalAmount || 0,
        status: o.status || "Placed",
        paymentStatus: o.paymentStatus || "Unpaid",
        date: parseDate(o.createdAt),
        items: o.items || [],
        shippingAddress: o.shippingAddress || {},
        source: o.source 
      }));

      setOrders(formatted);

    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= UPDATE STATUS ================= */
  const updateOrderStatus = async (id, status) => {
    try {
      // optimistic UI update (instant change)
      setOrders(prev =>
        prev.map(o => o.id === id ? { ...o, status } : o)
      );

      await fetch(`${API}/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      // optional refetch (keeps DB sync)
      fetchOrders();

    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

  /* ================= GET ORDER ================= */
  const getOrderById = (id) =>
    orders.find(o => String(o.id) === String(id));

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        updateOrderStatus,
        getOrderById,
        refetchOrders: fetchOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
