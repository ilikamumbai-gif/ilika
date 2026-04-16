import { useEffect, useState } from "react";
import { Trash2, KeyRound, Plus, Eye, EyeOff, Shield } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";

const API = `${import.meta.env.VITE_API_URL}/api`;

const AdminList = () => {
  const [admins, setAdmins]           = useState([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [form, setForm]               = useState({ username: "", password: "", role: "superadmin" });
  const [showFormPass, setShowFormPass] = useState(false);

  const fetchAdmins = async () => {
    const res  = await fetch(`${API}/admins`);
    const data = await res.json();
    setAdmins(data);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API}/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await logActivity(`Created admin: ${form.username}`);
      setForm({ username: "", password: "", role: "superadmin" });
      fetchAdmins();
    } else {
      alert("Failed to create admin");
    }
    setLoading(false);
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    const admin = admins.find(a => a.id === id);
    await fetch(`${API}/admins/${id}`, { method: "DELETE" });
    await logActivity(`Deleted admin: ${admin?.username}`);
    fetchAdmins();
  };

  const resetPassword = async (id) => {
    const newPass = prompt("Enter new password:");
    if (!newPass) return;
    const admin = admins.find(a => a.id === id);
    await fetch(`${API}/admins/${id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPass }),
    });
    await logActivity(`Reset password for admin: ${admin?.username}`);
    alert("Password updated successfully");
    fetchAdmins();
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Manage Admins</h1>
        <p className="text-sm text-gray-400 mt-0.5">{admins.length} admin accounts</p>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: "1px solid #EBEBEB" }}>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Add New Admin</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Username</label>
            <input
              type="text"
              placeholder="e.g. john_admin"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full h-10 px-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
              style={{ border: "1px solid #E0E0E0" }}
              required
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showFormPass ? "text" : "password"}
                placeholder="Strong password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full h-10 pl-3 pr-9 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 transition"
                style={{ border: "1px solid #E0E0E0" }}
                required
              />
              <button type="button" onClick={() => setShowFormPass(!showFormPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showFormPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 h-10 px-5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 shrink-0"
            style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
          >
            <Plus size={15} /> {loading ? "Creating…" : "Create Admin"}
          </button>
        </form>
      </div>

      {/* Admins table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "#888" }}>Admin Accounts</h3>
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
                  {["Admin", "Password", "Role", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#aaa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} className="hover:bg-gray-50/70 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
                          {admin.username?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{admin.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-gray-500">
                      {showPasswords ? admin.password : "••••••••••"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                        {admin.role || "superadmin"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resetPassword(admin.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <KeyRound size={12} /> Reset Password
                        </button>
                        <button
                          onClick={() => deleteAdmin(admin.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
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
