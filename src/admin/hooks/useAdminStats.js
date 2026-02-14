import { useProducts } from "../context/ProductContext";
import { useOrders } from "../context/OrderContext";
import { useUsers } from "../context/UserContext";

export const useAdminStats = () => {
  const { products } = useProducts();
  const { orders } = useOrders();
  const { users } = useUsers();

  const revenue = orders.reduce((t, o) => t + o.total, 0);

  return {
    products: products.length,
    orders: orders.length,
    users: users.length,
    revenue,
  };
};
