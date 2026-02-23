import React from "react";
import { Package, Users, ShoppingCart, IndianRupee } from "lucide-react";
import StatCard from "../components/StatCard";
import AdminLayout from "../components/AdminLayout";
import { useAdminStats } from "../context/AdminStatsContext";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import { useUsers } from "../context/UserContext";

const Dashboard = () => {
  const { stats } = useAdminStats();
  const { orders } = useOrders();
  const {products} = useProducts();
  const {users} = useUsers();

  const totalProducts = products.length
  const totalRevenue = orders.reduce((a, o) => a + o.total, 0);
  const totalOrders = orders.length;
  const totalUsers = users.length;

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          color="bg-indigo-100"
          textColor="text-indigo-600"
        />

        <StatCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          color="bg-green-100"
          textColor="text-green-600"
        />

        <StatCard
          title="Users"
          value={totalUsers}
          icon={Users}
          color="bg-yellow-100"
          textColor="text-yellow-600"
        />

        <StatCard
          title="Revenue"
          value={totalRevenue}
          icon={IndianRupee}
          color="bg-pink-100"
          textColor="text-pink-600"
          footer="This month"
        />
      </div>

    </AdminLayout>
  );
};

export default Dashboard;
