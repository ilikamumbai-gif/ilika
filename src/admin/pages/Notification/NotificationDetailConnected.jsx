import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";
import {
  findMatchedUser,
  getRecordDisplayEmail,
} from "../../Utils/customerConnections";
import { getApiUrl } from "../../../utils/api";

const formatDate = (value) => {
  if (!value) return "-";
  if (value?._seconds) return new Date(value._seconds * 1000).toLocaleString("en-IN");
  return new Date(value).toLocaleString("en-IN");
};

const NotificationDetailConnected = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { users } = useUsers();
  const { orders } = useOrders();
  const [data, setData] = useState({ productName: "", count: 0, users: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/notify/${productId}`));
        const payload = await res.json();
        setData(payload && Array.isArray(payload.users) ? payload : { productName: "", count: 0, users: [] });
      } catch (error) {
        console.error(error);
        setData({ productName: "", count: 0, users: [] });
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchData();
  }, [productId]);

  if (loading) {
    return <AdminLayout>Loading...</AdminLayout>;
  }

  return (
    <AdminLayout>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-pink-600 hover:underline">
        Back
      </button>

      <div className="space-y-6 rounded-2xl border bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{data.productName || "Product"}</h1>
          <p className="text-sm text-gray-500">{data.count || 0} users requested notification</p>
        </div>

        <div className="overflow-hidden rounded-2xl border">
          {data.users.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No users found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Orders</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((entry) => {
                  const matchedUser = findMatchedUser(users, entry);
                  const orderCount = orders.filter((order) => {
                    if (matchedUser) {
                      return String(order.userId || "") === String(matchedUser.id || matchedUser.uid || "") || String(order.userEmail || "").toLowerCase() === String(matchedUser.email || "").toLowerCase();
                    }
                    return String(order.userEmail || "").toLowerCase() === String(getRecordDisplayEmail(entry)).toLowerCase();
                  }).length;

                  return (
                    <tr key={entry.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        {matchedUser ? (
                          <button onClick={() => navigate(`/admin/users/${matchedUser.id}`)} className="font-semibold text-pink-600 hover:underline">
                            {matchedUser.name || "Registered User"}
                          </button>
                        ) : (
                          <span className="font-medium text-gray-800">{entry.userId || "Guest"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{matchedUser?.email || getRecordDisplayEmail(entry)}</td>
                      <td className="px-4 py-3">{orderCount}</td>
                      <td className="px-4 py-3">{formatDate(entry.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationDetailConnected;
