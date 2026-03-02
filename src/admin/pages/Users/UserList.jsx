import React from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";
import AdminLayout from "../../components/AdminLayout";

const UserList = () => {

  const navigate = useNavigate();
  const { users, deleteUser } = useUsers();
  const { orders } = useOrders();

  const getOrderCount = (userId) =>
    orders?.filter(o => String(o?.userId) === String(userId)).length || 0;


  const handleDelete = (id) => {

    if (!window.confirm("Delete this user?")) return;

    deleteUser(id);

  };


  return (

    <AdminLayout>

      <h1 className="text-xl font-semibold mb-6">
        Users
      </h1>


      {/* TABLE */}

      <div className="bg-white border rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 border-b">

            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Orders</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>

          </thead>


          <tbody>

            {users.map((user) => (

              <tr
                key={user.id}
                className="border-b last:border-none hover:bg-gray-50"
              >

                <td className="px-4 py-3 font-medium">
                  {user.name}
                </td>

                <td className="px-4 py-3">
                  {user.email}
                </td>

                <td className="px-4 py-3">
                  {getOrderCount(user.id)}
                </td>

                <td className="px-4 py-3 text-right space-x-3">

                  {/* VIEW */}
                  <button
                    onClick={() =>
                      navigate(`/admin/users/${user.id}`)
                    }
                    className="text-sm font-medium underline"
                  >
                    View
                  </button>


                  {/* DELETE */}
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-sm text-red-600 underline"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </AdminLayout>

  );

};

export default UserList;