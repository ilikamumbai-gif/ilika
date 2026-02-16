import React from "react";
import { useOrders } from "../../context/OrderContext";

const RevenueReport = () => {
  const { orders } = useOrders();

  const totalRevenue = orders.reduce((a, o) => a + o.total, 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <Card title="Total Revenue" value={`₹${totalRevenue}`} color="green" />
      <Card title="Total Orders" value={totalOrders} color="blue" />
      <Card title="Average Order Value" value={`₹${avgOrder}`} color="purple" />

      {/* Orders List */}
      <div className="md:col-span-3 bg-white border rounded-xl p-4">
        <h3 className="font-semibold mb-3">Recent Orders</h3>

        <div className="divide-y">
          {orders.map(o => (
            <div key={o.id} className="py-2 flex justify-between text-sm">
              <span>#{o.id} - {o.userName}</span>
              <span className="font-medium">₹{o.total}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const Card = ({ title, value, color }) => (
  <div className={`bg-white border-l-4 border-${color}-500 rounded-xl p-4`}>
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

export default RevenueReport;