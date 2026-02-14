import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { users } = useUsers();
  const { orders } = useOrders();

  const user = users.find((u) => u.id == id);
  const userOrders = orders.filter((o) => o.userId == id);

  if (!user) {
    return (
      <AdminLayout>
        <p>User not found</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <button
        onClick={() => navigate(-1)}
        className="text-sm underline mb-4"
      >
        ← Back
      </button>

      <h1 className="text-xl font-semibold mb-6">User Details</h1>

      {/* USER INFO */}
      <div className="bg-white border rounded-xl p-4 mb-6">
        <p className="font-semibold text-lg">{user.name}</p>
        <p className="text-sm text-gray-600">{user.email}</p>
        <p className="text-sm mt-2">
          Total Orders: <strong>{userOrders.length}</strong>
        </p>
      </div>

      {/* DESKTOP ORDERS TABLE */}
      <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {userOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b last:border-none hover:bg-gray-50"
              >
                <td className="px-4 py-3">{order.id}</td>
                <td className="px-4 py-3">{order.date}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 text-xs border rounded">
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  ₹{order.total}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      navigate(`/admin/orders/${order.id}`)
                    }
                    className="underline text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {userOrders.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">
            No orders found
          </p>
        )}
      </div>

      {/* MOBILE ORDER CARDS */}
      <div className="md:hidden space-y-4">
        {userOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white border rounded-xl p-4"
          >
            <p className="font-medium">Order #{order.id}</p>
            <p className="text-sm text-gray-500">{order.date}</p>

            <div className="flex justify-between mt-2 text-sm">
              <span>Status: {order.status}</span>
              <span>₹{order.total}</span>
            </div>

            <button
              onClick={() =>
                navigate(`/admin/orders/${order.id}`)
              }
              className="mt-3 text-sm underline"
            >
              View Order
            </button>
          </div>
        ))}

        {userOrders.length === 0 && (
          <p className="text-sm text-center text-gray-500">
            No orders found
          </p>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserDetail;
