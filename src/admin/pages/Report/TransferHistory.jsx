import React from "react";
import { useOrders } from "../../context/OrderContext";

const TransferHistory = () => {
  const { orders } = useOrders();

  return (
    <div className="bg-white border rounded-xl overflow-hidden">

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Order</th>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Amount</th>
          </tr>
        </thead>

        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-t">
              <td className="px-4 py-3">#{o.id}</td>
              <td className="px-4 py-3">{o.createdAt}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs
                  ${o.status === "Delivered"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"}`}>
                  {o.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium">₹{o.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default TransferHistory;