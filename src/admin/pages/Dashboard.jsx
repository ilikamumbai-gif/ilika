import React from "react";
import { Package, Users, ShoppingCart, IndianRupee } from "lucide-react";
import StatCard from "../components/StatCard";
import AdminLayout from "../components/AdminLayout";
import { useAdminStats } from "../context/AdminStatsContext";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const Dashboard = () => {
  const { stats } = useAdminStats();

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          color="bg-indigo-100"
          textColor="text-indigo-600"
        />

        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="bg-green-100"
          textColor="text-green-600"
        />

        <StatCard
          title="Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-yellow-100"
          textColor="text-yellow-600"
        />

        <StatCard
          title="Revenue"
          value={`₹${(stats.revenue / 100000).toFixed(1)}L`}
          icon={IndianRupee}
          color="bg-pink-100"
          textColor="text-pink-600"
          footer="This month"
        />
      </div>

      {/* ORDERS BY MONTH CHART */}
      <div className="mt-10 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Orders by Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.ordersByMonth}>
            <CartesianGrid stroke="#f5f5f5" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
