import React from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";
import AdminLayout from "../../components/AdminLayout";
import { Eye, Trash2 } from "lucide-react";
import { logActivity } from "../../Utils/logActivity";

const UserList = () => {

  const navigate = useNavigate();
  const { users, deleteUser } = useUsers();
  const { orders } = useOrders();


  const hasOrder = (userId) =>
    orders.some(
      o => String(o.userId) === String(userId)
    );


  const getOrderCount = (userId) =>
    orders.filter(
      o => String(o.userId) === String(userId)
    ).length;


  /* ================= DELETE ================= */

  const handleDelete = async (user) => {

    if (!confirm("Delete user?")) return;

    await deleteUser(user.id);

    await logActivity(
      `Deleted user ${user.name} (${user.email})`
    );

  };


  return (
    <AdminLayout>

      <h1 className="text-xl font-semibold mb-6">
        Users
      </h1>


      <div className="bg-white border rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 border-b">

            <tr>

              <th className="px-4 py-3 text-left">
                Name
              </th>

              <th className="px-4 py-3 text-left">
                Email
              </th>

              <th className="px-4 py-3 text-left">
                Status
              </th>

              <th className="px-4 py-3 text-left">
                Orders
              </th>

              <th className="px-4 py-3 text-right">
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {users.map(user => {

              const active = hasOrder(user.id);

              return (

                <tr
                  key={user.id}
                  className="border-b"
                >

                  <td className="px-4 py-3 font-medium">
                    {user.name}
                  </td>


                  <td className="px-4 py-3">
                    {user.email}
                  </td>


                  {/* STATUS */}
                  <td className="px-4 py-3">

                    {active ? (

                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        Active
                      </span>

                    ) : (

                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactive
                      </span>

                    )}

                  </td>


                  {/* ORDER COUNT */}
                  <td className="px-4 py-3">
                    {getOrderCount(user.id)}
                  </td>


                  {/* ACTION */}
                  <td className="px-4 py-3 text-right flex gap-3 justify-end">

                    <Eye
                      size={18}
                      className="cursor-pointer text-blue-600"
                      onClick={() =>
                        navigate(`/admin/users/${user.id}`)
                      }
                    />

                    <Trash2
                      size={18}
                      className="cursor-pointer text-red-600"
                      onClick={() =>
                        handleDelete(user)
                      }
                    />

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </AdminLayout>
  );
};

export default UserList;