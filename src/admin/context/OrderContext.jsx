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
        userId: o.userId,
        userEmail: o.userEmail || "guest@email.com",
        total: o.totalAmount || 0,
        totalAmount: o.totalAmount || 0,
        status: o.status || "Placed",
        paymentStatus: o.paymentStatus || "Unpaid",
        paymentMethod: o.paymentMethod || (o.razorpay_payment_id ? "ONLINE" : "COD"),
        razorpay_payment_id: o.razorpay_payment_id || null,
        date: parseDate(o.createdAt),
        createdAt: o.createdAt || null,
        paidAt: o.paidAt || null,
        items: o.items || [],
        shippingAddress: o.shippingAddress || {},
        source: o.source || "WEBSITE",
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

  const deleteAllOrders = async () => {
    try {

      await fetch(`${API}/api/orders`, {
        method: "DELETE",
      });

      fetchOrders();

    } catch (err) {
      console.error("Delete all orders failed", err);
    }
  };

  /* ================= GET ORDER ================= */
  const getOrderById = (id) =>
    orders.find(o => String(o.id) === String(id));

  const deleteOrder = async (id) => {
    try {

      await fetch(`${API}/api/orders/${id}`, {
        method: "DELETE",
      });

      fetchOrders();

    } catch (err) {
      console.error("Delete order failed", err);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        updateOrderStatus,
        getOrderById,
        refetchOrders: fetchOrders,
        deleteAllOrders,
        deleteOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
