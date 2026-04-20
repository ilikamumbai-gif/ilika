import React, { useEffect, useState } from "react";
import { Eye, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";

const NotificationList = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notify`);
      const data = await res.json();

      // fallback safety
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Notifications</h1>
        <p className="text-sm text-gray-400">
          {notifications.length} products
        </p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
            <Bell size={30} />
            No notification requests
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Requests</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {notifications.map((n) => (
                <tr
                  key={n.productId}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-5 py-4 font-semibold">
                    {n.productName || "Unknown Product"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      {n.count || 0} users
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() =>
                        navigate(`/admin/notifications/${n.productId}`)
                      }
                      className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default NotificationList;