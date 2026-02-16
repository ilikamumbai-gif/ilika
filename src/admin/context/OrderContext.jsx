import { createContext, useContext, useState, useEffect } from "react";

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("orders");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const getOrderById = (id) =>
    orders.find(o => String(o.id) === String(id));

  const addOrder = (orderData) => {
  setOrders(prev => [orderData, ...prev]);
  return orderData.id;
};


  const unseenCount = orders.filter(o => !o.seen).length;

  const markAllSeen = () => {
    setOrders(prev => prev.map(o => ({ ...o, seen: true })));
  };

  const updateOrderStatus = (id, status) => {
    setOrders(prev =>
      prev.map(o =>
        String(o.id) === String(id) ? { ...o, status } : o
      )
    );
  };

  return (
    <OrderContext.Provider value={{
      orders,
      addOrder,
      getOrderById,
      updateOrderStatus,
      markAllSeen,
      unseenCount
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
