import React, { useEffect, useState } from "react";
import { Logs, RefreshCw, Search } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";

const ACTION_COLORS = {
  delete: "bg-red-50 text-red-600",
  create: "bg-green-50 text-green-700",
  update: "bg-blue-50 text-blue-700",
  default: "bg-gray-100 text-gray-600",
};

const getActionColor = (msg = "") => {
  const m = msg.toLowerCase();
  if (m.includes("delet")) return ACTION_COLORS.delete;
  if (m.includes("creat") || m.includes("add")) return ACTION_COLORS.create;
  if (m.includes("updat") || m.includes("reset") || m.includes("download") || m.includes("print")) {
    return ACTION_COLORS.update;
  }
  return ACTION_COLORS.default;
};

const formatDate = (ts) => {
  if (!ts) return "-";
  const d = ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const toDate = (ts) => {
  if (!ts) return null;
  const d = ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getActivityType = (log = {}) => {
  const action = String(log.action || "").toLowerCase();
  const message = String(log.message || "").toLowerCase();
  if (action.includes("delet") || message.includes("delet")) return "delete";
  if (action.includes("creat") || action.includes("add") || message.includes("creat") || message.includes("add")) return "create";
  if (action.includes("updat") || message.includes("updat") || message.includes("edit")) return "update";
  if (action.includes("login") || message.includes("login")) return "login";
  if (action.includes("logout") || message.includes("logout")) return "logout";
  return "other";
};

const AdminLog = () => {
  const API = import.meta.env.VITE_API_URL;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/admin-log`);
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const adminOptions = Array.from(
    new Set(logs.map((l) => (l.admin || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const filtered = logs.filter((l) => {
    const matchesSearch =
      !search ||
      l.message?.toLowerCase().includes(search.toLowerCase()) ||
      l.admin?.toLowerCase().includes(search.toLowerCase());

    const matchesAdmin = !adminFilter || (l.admin || "") === adminFilter;
    const matchesActivity = !activityFilter || getActivityType(l) === activityFilter;

    const logDate = toDate(l.createdAt);
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const matchesFrom = !from || (logDate && logDate >= from);
    const matchesTo = !to || (logDate && logDate <= to);

    return matchesSearch && matchesAdmin && matchesActivity && matchesFrom && matchesTo;
  });

  const clearFilters = () => {
    setSearch("");
    setAdminFilter("");
    setActivityFilter("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">{logs.length} actions recorded</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-xl hover:bg-gray-50 transition"
          style={{ border: "1px solid #E0E0E0" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 space-y-3" style={{ border: "1px solid #EBEBEB" }}>
        <div className="flex items-center gap-3">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by action or admin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm rounded-xl px-3 py-2 bg-white border border-gray-200"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm rounded-xl px-3 py-2 bg-white border border-gray-200"
          />
          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="text-sm rounded-xl px-3 py-2 bg-white border border-gray-200"
          >
            <option value="">All Admins</option>
            {adminOptions.map((adminName) => (
              <option key={adminName} value={adminName}>
                {adminName}
              </option>
            ))}
          </select>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="text-sm rounded-xl px-3 py-2 bg-white border border-gray-200"
          >
            <option value="">All Activities</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={clearFilters}
            className="text-sm rounded-xl px-3 py-2 border border-gray-200 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Logs size={40} className="mb-3" />
            <p className="text-sm">No activity recorded for selected filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((log, i) => (
              <div key={log.id || i} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-1 ${getActionColor(log.message).split(" ")[0]}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionColor(log.message)}`}>
                      {log.admin || "Admin"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium leading-snug">{log.message}</p>
                </div>

                <p className="text-xs text-gray-400 shrink-0 text-right whitespace-nowrap">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLog;
