import { createContext, useContext, useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthContext";
import { useOrders } from "../admin/context/OrderContext";

const UserOrderContext = createContext(null);

export const UserOrderProvider = ({ children }) => {
  const { cartItems, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { addOrder } = useOrders(); // admin orders sync

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("user_orders");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("user_orders", JSON.stringify(orders));
  }, [orders]);

  const generateOrderId = () => "ORD" + Date.now().toString().slice(-6);

  const calculateTotals = (items) => {
    const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
    const gst = Math.round(subtotal * 0.18);
    const shipping = subtotal > 999 ? 0 : 49;

    return {
      subtotal,
      gst,
      shipping,
      total: subtotal + gst + shipping,
    };
  };

  // ⭐ MAIN FUNCTION
  const placeOrder = (address) => {
    if (!cartItems.length || !currentUser) return;

    const totals = calculateTotals(cartItems);

  const source = localStorage.getItem("traffic_source") || "WEBSITE";

const newOrder = {
  id: generateOrderId(),
  userId: currentUser.uid,
  userEmail: currentUser.email,
  date: new Date().toLocaleString(),
  status: "Pending",
  address,
  items: cartItems,
  source,              // ⭐⭐⭐ ADDED
  ...totals,
};

    // save in user side
    setOrders(prev => [newOrder, ...prev]);

    // ALSO SAVE IN ADMIN PANEL
    addOrder({
      userId: currentUser.uid,
      userName: currentUser.email,
      total: totals.total,
      items: cartItems,
      address
    });

    clearCart();

    return newOrder.id;
  };

  const getOrderById = (id) => orders.find(o => o.id === id);

  return (
    <UserOrderContext.Provider value={{ orders, placeOrder, getOrderById }}>
      {children}
    </UserOrderContext.Provider>
  );
};

export const useUserOrders = () => {
  const ctx = useContext(UserOrderContext);
  if (!ctx) throw new Error("useUserOrders must be used inside UserOrderProvider");
  return ctx;
};
