import React from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";
import AdminLayout from "../../components/AdminLayout";

const UserList = () => { 
  const navigate = useNavigate();
  const { users } = useUsers();
  const { orders } = useOrders();

 const getOrderCount = (userId) =>
  orders?.filter(o => String(o?.userId) === String(userId)).length || 0;



  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-6">Users</h1>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-none hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="text-sm font-medium text-black underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border rounded-xl p-4"
          >
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>

            <div className="flex justify-between items-center mt-3">
              <span className="text-sm">
                Orders:{" "}
                <strong>{getOrderCount(user.id)}</strong>
              </span>
              <button
                onClick={() => navigate(`/admin/users/${user.id}`)}
                className="text-sm font-medium underline"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default UserList;
