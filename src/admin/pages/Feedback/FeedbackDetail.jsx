import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";

const parseDate = (value) => {
  if (!value) return "-";
  if (value?._seconds) return new Date(value._seconds * 1000).toLocaleString("en-IN");
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString("en-IN");
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

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/feedback/${id}`);
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Feedback API route not found (backend not updated)." : data?.error || "Feedback not found");
      }
      setFeedback(data);
    } catch (err) {
      console.error("Feedback detail fetch error:", err);
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFeedback();
  }, [id]);

  const updateStatus = async (nextStatus) => {
    if (!feedback || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`${API}/api/feedback/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Feedback API route not found (backend not updated)." : data?.error || "Failed to update status");
      }
      setFeedback((prev) => ({ ...prev, status: nextStatus }));
    } catch (err) {
      console.error("Feedback status update failed:", err);
      alert(err?.message || "Unable to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const deleteFeedback = async () => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      const res = await fetch(`${API}/api/feedback/${id}`, { method: "DELETE" });
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Feedback API route not found (backend not updated)." : data?.error || "Delete failed");
      }
      navigate("/admin/feedback");
    } catch (err) {
      console.error("Feedback delete failed:", err);
      alert(err?.message || "Unable to delete feedback");
    }
  };

  if (loading) return <AdminLayout>Loading...</AdminLayout>;
  if (!feedback) return <AdminLayout>Feedback not found.</AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-5">
        <button onClick={() => navigate(-1)} className="text-sm underline">
          Back
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Feedback Detail</h1>
          <p className="text-sm text-gray-500">Submitted on {parseDate(feedback.createdAt)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Name</p>
            <p className="font-medium">{feedback.name || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{feedback.email || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium">{feedback.phone || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Order ID</p>
            <p className="font-medium">{feedback.orderId || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Issue Type</p>
            <p className="font-medium capitalize">{String(feedback.issueType || "other").replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-gray-500">Rating</p>
            <p className="font-medium">{feedback.rating || "-"}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Message</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm whitespace-pre-wrap">
            {feedback.message || "-"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={feedback.status || "open"}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={statusUpdating}
            className="h-10 px-3 text-sm border rounded-lg bg-white focus:outline-none"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <button
            onClick={deleteFeedback}
            className="h-10 px-4 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Delete Feedback
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FeedbackDetail;
