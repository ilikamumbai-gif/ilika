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

      {/* CUSTOMER DETAILS */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Shipping Address</h2>

        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-medium">{order.userName}</p>
          <p>{order.address?.line}</p>
          <p>
            {order.address?.city}, {order.address?.state} - {order.address?.pincode}
          </p>
          <p className="mt-2">
            <span className="text-gray-500">Phone:</span> {order.phone}
          </p>
        </div>
      </div>

      {/* ITEMS */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <h2 className="px-4 py-3 border-b font-semibold">Order Items</h2>

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
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-right">₹{item.price}</td>
                <td className="px-4 py-3 text-right font-medium">
                  ₹{item.quantity * item.price}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTAL */}
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
