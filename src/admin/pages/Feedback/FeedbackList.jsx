import React, { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, Search, MessageSquare, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";

const formatDate = (value) => {
  if (!value) return "-";
  if (value?._seconds) return new Date(value._seconds * 1000).toLocaleString("en-IN");
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString("en-IN");
};

const statusClass = (status = "open") => {
  const s = String(status).toLowerCase();
  if (s === "resolved") return "bg-emerald-100 text-emerald-700";
  if (s === "in_progress") return "bg-amber-100 text-amber-700";
  if (s === "closed") return "bg-gray-200 text-gray-700";
  return "bg-rose-100 text-rose-700";
};

const reviewSyncClass = (status = "") => {
  const value = String(status || "").toLowerCase();
  if (value === "created") return "bg-emerald-100 text-emerald-700";
  if (value === "failed") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
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

const StarRating = ({ rating }) => {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  if (!value) return <span className="text-gray-400">-</span>;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={star <= value ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-600">{value}/5</span>
    </div>
  );
};

const FeedbackList = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [togglingId, setTogglingId] = useState("");

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/feedback`);
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Feedback API route not found (backend not updated)." : "Fetch feedback failed");
      }
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch feedback list failed:", err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const deleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await fetch(`${API}/api/feedback/${id}`, { method: "DELETE" });
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete feedback failed:", err);
    }
  };

  const updateFeedbackReviewToggle = async (id, nextValue) => {
    if (togglingId) return;
    try {
      setTogglingId(id);
      const res = await fetch(`${API}/api/feedback/${id}/review-toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeedbackReview: nextValue }),
      });
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Feedback toggle API route not found." : data?.error || "Toggle update failed");
      }

      setFeedbacks((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isFeedbackReview: nextValue } : item
        )
      );
    } catch (err) {
      console.error("Feedback review toggle failed:", err);
      alert(err?.message || "Unable to update feedback review toggle");
    } finally {
      setTogglingId("");
    }
  };

  const filtered = useMemo(() => {
    return feedbacks.filter((item) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.productName?.toLowerCase().includes(term) ||
        item.orderId?.toLowerCase().includes(term) ||
        item.message?.toLowerCase().includes(term);

      const matchesStatus =
        !statusFilter || String(item.status || "open").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [feedbacks, search, statusFilter]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Feedback</h1>
        <p className="text-sm text-gray-400">{feedbacks.length} total feedback messages</p>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center border border-gray-200">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email, product..."
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
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
            <MessageSquare size={32} />
            No feedback found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Rating</th>
                  <th className="px-5 py-3 text-left">Feedback Review</th>
                  <th className="px-5 py-3 text-left">Review Sync</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium">{item.name || "-"}</td>
                    <td className="px-5 py-4 text-gray-600">{item.email || "-"}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">{item.productName || item.orderId || "-"}</div>
                      {item.productId ? (
                        <div className="text-xs text-gray-400 mt-0.5">{item.productId}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <StarRating rating={item.rating} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateFeedbackReviewToggle(item.id, !(item.isFeedbackReview === true))}
                          disabled={togglingId === item.id}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                            item.isFeedbackReview === true ? "bg-blue-600" : "bg-gray-300"
                          } ${togglingId === item.id ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                              item.isFeedbackReview === true ? "translate-x-7" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className={`text-sm font-medium ${item.isFeedbackReview === true ? "text-blue-600" : "text-gray-500"}`}>
                          {item.isFeedbackReview === true ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${reviewSyncClass(item.reviewSyncStatus)}`}>
                        {item.reviewSyncStatus === "created"
                          ? "Added to reviews"
                          : item.reviewSyncStatus === "failed"
                            ? "Sync failed"
                            : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusClass(item.status)}`}>
                        {String(item.status || "open").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/feedback/${item.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => deleteFeedback(item.id)}
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

export default FeedbackList;
