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
  if (s === "approved") return "bg-emerald-100 text-emerald-700";
  if (s === "rejected") return "bg-rose-100 text-rose-700";
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

const typeLabel = (type = "complaint") =>
  type === "warranty_claim" ? "Warranty Claim" : "Complaint";

const SupportTicketList = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/support-tickets`);
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Support API route not found (backend not updated)." : "Fetch support tickets failed");
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch support tickets failed:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this support ticket?")) return;
    try {
      await fetch(`${API}/api/support-tickets/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete support ticket failed:", err);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.name?.toLowerCase().includes(term) ||
        item.phone?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.productName?.toLowerCase().includes(term) ||
        item.modelName?.toLowerCase().includes(term) ||
        item.productTypeName?.toLowerCase().includes(term) ||
        item.issueSummary?.toLowerCase().includes(term) ||
        item.city?.toLowerCase().includes(term) ||
        item.state?.toLowerCase().includes(term);

      const matchesStatus =
        !statusFilter || String(item.status || "pending").toLowerCase() === statusFilter;
      const matchesType =
        !typeFilter || String(item.ticketType || "complaint").toLowerCase() === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, search, statusFilter, typeFilter]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-400">{items.length} total complaints and warranty claims</p>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center border border-gray-200">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, phone, email, product, subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] text-sm bg-transparent focus:outline-none placeholder-gray-300"
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 px-3 text-sm border rounded-lg bg-white focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="complaint">Complaint</option>
          <option value="warranty_claim">Warranty Claim</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-sm border rounded-lg bg-white focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
            <ShieldCheck size={32} />
            No support ticket found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Subject</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{item.name || "-"}</p>
                      <p className="text-xs text-gray-500">{item.phone || "-"}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{typeLabel(item.ticketType)}</td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{item.modelName || item.productName || "-"}</p>
                      <p className="text-xs text-gray-400">{item.productTypeName || "-"}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 max-w-[220px]">{item.issueSummary || "-"}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {[item.city, item.state].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass(item.status)}`}>
                        {String(item.status || "pending").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/support-tickets/${item.id}`)}
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

export default SupportTicketList;
