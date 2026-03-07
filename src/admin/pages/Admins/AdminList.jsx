import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { logActivity } from "../../Utils/logActivity";

const API = `${import.meta.env.VITE_API_URL}/api`;

const AdminList = () => {

  const [admins, setAdmins] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "superadmin",
  });

  /* ================= FETCH ADMINS ================= */

  const fetchAdmins = async () => {
    try {

      const res = await fetch(`${API}/admins`);

      if (!res.ok) throw new Error("Failed to fetch admins");

      const data = await res.json();

      setAdmins(data);

    } catch (err) {
      console.error("Fetch admins error:", err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  /* ================= CREATE ADMIN ================= */

  const handleCreate = async (e) => {

    e.preventDefault();

    try {

      const res = await fetch(`${API}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        alert("Failed to create admin");
        return;
      }

      /* 🔹 LOG ACTIVITY */
      await logActivity(
        `Created new superadmin: ${form.username}`
      );

      setForm({
        username: "",
        password: "",
        role: "superadmin",
      });

      fetchAdmins();

    } catch (err) {
      console.error("Create admin error:", err);
    }

  };

  /* ================= DELETE ADMIN ================= */

  const deleteAdmin = async (id) => {

    if (!window.confirm("Delete this admin?")) return;

    try {

      const admin = admins.find(a => a.id === id);

      await fetch(`${API}/admins/${id}`, {
        method: "DELETE",
      });

      /* 🔹 LOG ACTIVITY */
      await logActivity(
        `Deleted admin: ${admin?.username}`
      );

      fetchAdmins();

    } catch (err) {
      console.error("Delete admin error:", err);
    }

  };

  /* ================= RESET PASSWORD ================= */

  const resetPassword = async (id) => {

    const newPassword = prompt("Enter new password");

    if (!newPassword) return;

    try {

      const admin = admins.find(a => a.id === id);

      await fetch(`${API}/admins/${id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      /* 🔹 LOG ACTIVITY */
      await logActivity(
        `Reset password for admin: ${admin?.username}`
      );

      alert("Password updated");

    } catch (err) {
      console.error("Reset password error:", err);
    }

  };

  return (
    <AdminLayout>

      <h1 className="text-xl font-semibold mb-6">
        Admin Management
      </h1>

      {/* CREATE ADMIN */}

      <form
        onSubmit={handleCreate}
        className="flex gap-3 mb-6 flex-wrap"
      >

        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          className="border p-2 rounded"
          required
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="px-3 border rounded"
        >
          {showPassword ? "Hide" : "Show"}
        </button>

        <button className="bg-black text-white px-4 rounded">
          Create Superadmin
        </button>

      </form>

      {/* ADMIN LIST */}

      <table className="w-full border">

        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Username</th>
            <th className="p-2 text-left">Password</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>

          {admins.map(admin => (

            <tr key={admin.id} className="border-t">

              <td className="p-2">
                {admin.username}
              </td>

              <td className="p-2">
                {showPassword ? admin.password : "••••••••"}
              </td>

              <td className="p-2 capitalize">
                superadmin
              </td>

              <td className="p-2 flex gap-3">

                <button
                  onClick={() => resetPassword(admin.id)}
                  className="text-blue-600"
                >
                  Reset Password
                </button>

                <button
                  onClick={() => deleteAdmin(admin.id)}
                  className="text-red-600"
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </AdminLayout>
  );
};

export default AdminList;