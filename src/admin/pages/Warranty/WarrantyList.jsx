import React, { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, Search, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";

const formatDate = (value) => {
  if (!value) return "-";
  if (value?._seconds) return new Date(value._seconds * 1000).toLocaleString("en-IN");
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString("en-IN");
};

const statusClass = (status = "pending") => {
  const s = String(status).toLowerCase();
  if (s === "eligible") return "bg-emerald-100 text-emerald-700";
  if (s === "not_eligible") return "bg-rose-100 text-rose-700";
  if (s === "in_review") return "bg-amber-100 text-amber-700";
  if (s === "closed") return "bg-gray-200 text-gray-700";
  return "bg-blue-100 text-blue-700";
};

const parseApiResponse = async (res) => {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { data, text };
};

const WarrantyList = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/warranty-registrations`);
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Warranty API route not found (backend not updated)." : "Fetch warranty list failed");
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch warranty list failed:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this warranty request?")) return;
    try {
      await fetch(`${API}/api/warranty-registrations/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete warranty request failed:", err);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.name?.toLowerCase().includes(term) ||
        item.phone?.toLowerCase().includes(term) ||
        item.address?.toLowerCase().includes(term) ||
        item.productName?.toLowerCase().includes(term);

      const matchesStatus =
        !statusFilter || String(item.status || "pending").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Warranty Requests</h1>
        <p className="text-sm text-gray-400">{items.length} total warranty submissions</p>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center border border-gray-200">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, phone, product, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] text-sm bg-transparent focus:outline-none placeholder-gray-300"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm border rounded-lg bg-white focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="eligible">Eligible</option>
          <option value="not_eligible">Not Eligible</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
            <ShieldCheck size={32} />
            No warranty request found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Address</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium">{item.name || "-"}</td>
                    <td className="px-5 py-4 text-gray-600">{item.productName || "-"}</td>
                    <td className="px-5 py-4 text-gray-600">{item.address || "-"}</td>
                    <td className="px-5 py-4 text-gray-600">{item.phone || "-"}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass(item.status)}`}>
                        {String(item.status || "pending").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/warranty/${item.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
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

export default WarrantyList;
