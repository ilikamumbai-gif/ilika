import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";
import AdminLayout from "../../components/AdminLayout";
import { Eye, Trash2, Search, Users } from "lucide-react";
import { logActivity } from "../../Utils/logActivity";

const UserList = () => {
  const navigate = useNavigate();
  const { users, deleteUser } = useUsers();
  const { orders } = useOrders();
  const [search, setSearch] = useState("");

  const getOrderCount = (userId) => orders.filter(o => String(o.userId) === String(userId)).length;
  const getTotalSpent = (userId) => orders.filter(o => String(o.userId) === String(userId)).reduce((a, o) => a + (o.total || 0), 0);
  const isActive = (userId) => orders.some(o => String(o.userId) === String(userId));

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.name}?`)) return;
    await deleteUser(user.id);
    await logActivity(`Deleted user ${user.name} (${user.email})`);
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex gap-3 items-center" style={{ border: "1px solid #EBEBEB" }}>
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm focus:outline-none bg-transparent placeholder-gray-300"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                {["User", "Email", "Orders", "Total Spent", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <Users size={36} />
                      <p className="text-sm">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(user => {
                const orderCount = getOrderCount(user.uid || user.id);
                const spent = getTotalSpent(user.uid || user.id);
                const active = isActive(user.uid || user.id);
                return (
                  <tr key={user.id} className="hover:bg-gray-50/70 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="font-semibold text-gray-800">{user.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-800">{orderCount}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-800">₹{spent.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDelete(user)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map(user => {
            const orderCount = getOrderCount(user.uid || user.id);
            const spent = getTotalSpent(user.uid || user.id);
            const active = isActive(user.uid || user.id);
            return (
              <div key={user.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-gray-500">{orderCount} orders</span>
                      <span className="text-xs font-semibold text-gray-700">₹{spent.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Eye size={14} />
                  </button>
                  <button onClick={() => handleDelete(user)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserList;
