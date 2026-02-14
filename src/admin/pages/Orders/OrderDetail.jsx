import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useOrders } from "../../context/OrderContext";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrders();

  const order = getOrderById(id);

  if (!order) {
    return (
      <AdminLayout>
        <p className="text-gray-500">Order not found</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-xl font-semibold">
          Order #{order.id}
        </h1>
      </div>

      {/* ORDER SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Customer</p>
          <p className="font-medium">{order.userName}</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Order Date</p>
          <p className="font-medium">{order.date}</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500">Status</p>
          <span
            className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
              order.status === "Delivered"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* ITEMS */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <h2 className="px-4 py-3 border-b font-semibold">
          Order Items
        </h2>

        {/* DESKTOP */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b last:border-none">
                  <td className="px-4 py-3">{item.product}</td>
                  <td className="px-4 py-3 text-center">{item.qty}</td>
                  <td className="px-4 py-3 text-right">
                    ₹{item.price}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₹{item.qty * item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE */}
        <div className="md:hidden divide-y">
          {order.items.map((item, index) => (
            <div key={index} className="p-4 space-y-1">
              <p className="font-medium">{item.product}</p>
              <p className="text-sm text-gray-500">
                Qty: {item.qty}
              </p>
              <p className="text-sm text-gray-500">
                Price: ₹{item.price}
              </p>
              <p className="text-sm font-semibold">
                Total: ₹{item.qty * item.price}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* GRAND TOTAL */}
      <div className="flex justify-end mt-4">
        <div className="bg-white border rounded-xl p-4 w-full sm:w-64">
          <p className="text-sm text-gray-500">Grand Total</p>
          <p className="text-xl font-bold">₹{order.total}</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetail;
