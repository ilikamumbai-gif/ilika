import { createContext, useContext, useState } from "react";

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [orders] = useState([
    { id: 1, userId: 1, total: 999, status: "Pending" },
  ]);

  const getOrderById = (id) =>
    orders.find(o => o.id === Number(id));

  return (
    <OrderContext.Provider value={{ orders, getOrderById }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => useContext(OrderContext);
