import React, { useEffect, useState } from "react";
import { Trash2, KeyRound, Plus, Eye, EyeOff, Shield, Save } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";
import { ALL_ADMIN_PERMISSIONS, isSuperAdmin } from "../../Utils/permissions";
import { useAdminAuth } from "../../context/AdminAuthContext";

const API = `${import.meta.env.VITE_API_URL}/api`;

const ACCESS_LABELS = {
  products: "Products",
  coupons: "Coupons",
  combos: "Combos",
  categories: "Categories",
  orders: "Orders",
  "cart-products": "Cart Interest",
  notifications: "Notifications",
  users: "Users",
  reviews: "Reviews",
  feedback: "Feedback",
  warranty: "Warranty",
  blogs: "Blogs",
  reports: "Reports",
  logs: "Activity Log",
};

const MANAGEABLE_PERMISSIONS = ALL_ADMIN_PERMISSIONS.filter(
  (permission) => !["dashboard", "admins"].includes(permission)
);

const AdminList = () => {
  const { admin: currentAdmin, getAdminAuthHeaders } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFormPass, setShowFormPass] = useState(false);
  const [editingPermissionsId, setEditingPermissionsId] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "admin",
    permissions: ["dashboard", "products", "orders"],
  });

  const requesterIsSuperAdmin = isSuperAdmin(currentAdmin);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...getAdminAuthHeaders(),
  });

  const fetchAdmins = async () => {
    const res = await fetch(`${API}/admins`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    setAdmins(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      username: form.username.trim(),
      password: form.password,
      role: "admin",
      permissions: Array.from(new Set(["dashboard", ...form.permissions])),
    };

    const res = await fetch(`${API}/admins`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await logActivity(`Created admin: ${payload.username}`);
      setForm({
        username: "",
        password: "",
        role: "admin",
        permissions: ["dashboard", "products", "orders"],
      });
      fetchAdmins();
    } else {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Failed to create admin");
    }

    setLoading(false);
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    const targetAdmin = admins.find((a) => a.id === id);
    const res = await fetch(`${API}/admins/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Failed to delete admin");
      return;
    }

    await logActivity(`Deleted admin: ${targetAdmin?.username}`);
    fetchAdmins();
  };

  const resetPassword = async (id) => {
    const newPass = prompt("Enter new password:");
    if (!newPass) return;
    const targetAdmin = admins.find((a) => a.id === id);

    const res = await fetch(`${API}/admins/${id}/password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ password: newPass }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Failed to update password");
      return;
    }

    await logActivity(`Reset password for admin: ${targetAdmin?.username}`);
    alert("Password updated successfully");
    fetchAdmins();
  };

  const startEditPermissions = (adminItem) => {
    setEditingPermissionsId(adminItem.id);
    setPermissionDraft(Array.isArray(adminItem.permissions) ? adminItem.permissions : []);
  };

  const toggleDraftPermission = (permission) => {
    setPermissionDraft((prev) => {
      if (prev.includes(permission)) {
        return prev.filter((item) => item !== permission);
      }
      return [...prev, permission];
    });
  };

  const savePermissions = async (id) => {
    const targetAdmin = admins.find((a) => a.id === id);

    const res = await fetch(`${API}/admins/${id}/permissions`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        permissions: Array.from(new Set(["dashboard", ...permissionDraft])),
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      alert(error?.error || "Failed to update access");
      return;
    }

    await logActivity(`Updated access permissions for admin: ${targetAdmin?.username}`);
    setEditingPermissionsId(null);
    setPermissionDraft([]);
    fetchAdmins();
  };

  const renderAccessChips = (adminItem) => {
    if (adminItem.role === "superadmin") {
      return (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-pink-50 text-pink-700 border border-pink-200">
          Full Access
        </span>
      );
    }

    const permissions = Array.isArray(adminItem.permissions) ? adminItem.permissions : [];
    if (!permissions.length) return <span className="text-xs text-gray-400">No access assigned</span>;

    return (
      <div className="flex flex-wrap gap-1.5">
        {permissions.map((permission) => (
          <span
            key={`${adminItem.id}_${permission}`}
            className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
          >
            {ACCESS_LABELS[permission] || permission}
          </span>
        ))}
      </div>
    );
  };

  if (!requesterIsSuperAdmin) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900">Manage Admins</h1>
          <p className="text-sm text-gray-500 mt-2">
            Only superadmin can view passwords, reset passwords, and manage admin access.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Manage Admins</h1>
        <p className="text-sm text-gray-400 mt-0.5">{admins.length} admin accounts</p>
      </div>

      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: "1px solid #EBEBEB" }}>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Add New Admin</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Username</label>
              <input
                type="text"
                placeholder="e.g. john_admin"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full h-10 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                style={{ border: "1px solid #E0E0E0" }}
                required
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showFormPass ? "text" : "password"}
                  placeholder="Strong password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-10 pl-3 pr-9 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                  style={{ border: "1px solid #E0E0E0" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowFormPass(!showFormPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showFormPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Give Access</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {MANAGEABLE_PERMISSIONS.map((permission) => (
                <label
                  key={`create_${permission}`}
                  className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-700"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(permission)}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        permissions: prev.permissions.includes(permission)
                          ? prev.permissions.filter((item) => item !== permission)
                          : [...prev.permissions, permission],
                      }))
                    }
                  />
                  <span>{ACCESS_LABELS[permission] || permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 h-10 px-5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 shrink-0"
              style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
            >
              <Plus size={15} /> {loading ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "#888" }}>
            Admin Accounts
          </h3>
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
          >
            {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPasswords ? "Hide" : "Show"} passwords
          </button>
        </div>

        {admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <Shield size={36} className="mb-2" />
            <p className="text-sm">No admins yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #F5F5F5" }}>
                  {["Admin", "Password", "Role", "Access", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#aaa" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((adminItem) => (
                  <tr
                    key={adminItem.id}
                    className="hover:bg-gray-50/70 transition-colors"
                    style={{ borderBottom: "1px solid #F5F5F5" }}
                  >
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
                        >
                          {adminItem.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{adminItem.username}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-sm text-gray-500 align-top">
                      {showPasswords ? adminItem.password || "Not visible" : "**********"}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                        {adminItem.role || "admin"}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      {editingPermissionsId === adminItem.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {MANAGEABLE_PERMISSIONS.map((permission) => (
                              <label
                                key={`edit_${adminItem.id}_${permission}`}
                                className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs text-gray-700"
                                style={{ borderColor: "#E5E7EB" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={permissionDraft.includes(permission)}
                                  onChange={() => toggleDraftPermission(permission)}
                                />
                                <span>{ACCESS_LABELS[permission] || permission}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => savePermissions(adminItem.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition"
                            >
                              <Save size={12} /> Save Access
                            </button>
                            <button
                              onClick={() => {
                                setEditingPermissionsId(null);
                                setPermissionDraft([]);
                              }}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        renderAccessChips(adminItem)
                      )}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        {adminItem.role !== "superadmin" && (
                          <button
                            onClick={() => startEditPermissions(adminItem)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
                          >
                            Edit Access
                          </button>
                        )}
                        <button
                          onClick={() => resetPassword(adminItem.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <KeyRound size={12} /> Reset Password
                        </button>
                        {adminItem.role !== "superadmin" && (
                          <button
                            onClick={() => deleteAdmin(adminItem.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminList;
