import { createContext, useContext, useEffect, useState } from "react";

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ALL ORDERS ================= */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders`
        );
        const data = await res.json();

        const formatted = data.map((order) => ({
          id: order.id,
          userId: order.userId,
          userName: order.userEmail || "User",
          total: order.totalAmount,
          status: order.status,
          date: order.createdAt?._seconds
            ? new Date(order.createdAt._seconds * 1000).toLocaleDateString()
            : "-",
          items: order.items,
          address: order.shippingAddress,
        }));

        setOrders(formatted);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  /* ================= GET SINGLE ORDER ================= */
  const getOrderById = (id) =>
    orders.find((o) => String(o.id) === String(id));

  return (
    <OrderContext.Provider value={{ orders, loading, getOrderById }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
