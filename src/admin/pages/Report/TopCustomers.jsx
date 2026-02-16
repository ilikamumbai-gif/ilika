import React from "react";
import { useOrders } from "../../context/OrderContext";

const TopCustomers = () => {
  const { orders } = useOrders();

  const customers = {};

  orders.forEach(o => {
    if (!customers[o.userName]) customers[o.userName] = 0;
    customers[o.userName] += o.total;
  });

  const sorted = Object.entries(customers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3">Customer</th>
            <th className="text-right px-4 py-3">Total Spent</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map(([name, total], i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-3">{name}</td>
              <td className="px-4 py-3 text-right font-medium">₹{total}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default TopCustomers;