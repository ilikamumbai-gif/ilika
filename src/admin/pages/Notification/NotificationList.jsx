import React, { useEffect, useState } from "react";
import { Eye, Trash2, Bell } from "lucide-react";
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
      setNotifications(data);
    } catch (err) {
      console.error(err);
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
        <p className="text-sm text-gray-400">{notifications.length} requests</p>
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
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-b hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium">{n.productName}</td>
                  <td className="px-5 py-4">{n.userId || "Guest"}</td>
                  <td className="px-5 py-4">{n.email || "-"}</td>
                  <td className="px-5 py-4">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">
                      {n.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/notifications/${n.id}`)}
                      className="p-2 bg-blue-50 text-blue-600 rounded"
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