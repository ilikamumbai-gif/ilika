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

const typeLabel = (type = "complaint") =>
  type === "warranty_claim" ? "Warranty Claim" : "Complaint";

const SupportTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [note, setNote] = useState("");

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/support-tickets/${id}`);
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Support API route not found (backend not updated)." : data?.error || "Support ticket not found");
      }
      setItem(data);
      setNote(data?.adminNote || "");
    } catch (err) {
      console.error("Support ticket detail fetch error:", err);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const updateStatus = async (nextStatus) => {
    if (!item || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`${API}/api/support-tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, adminNote: note }),
      });
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Support API route not found (backend not updated)." : data?.error || "Failed to update status");
      }
      setItem((prev) => ({ ...prev, status: nextStatus, adminNote: note }));
    } catch (err) {
      console.error("Support ticket status update failed:", err);
      alert(err?.message || "Unable to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const deleteItem = async () => {
    if (!window.confirm("Delete this support ticket?")) return;
    try {
      const res = await fetch(`${API}/api/support-tickets/${id}`, { method: "DELETE" });
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Support API route not found (backend not updated)." : data?.error || "Delete failed");
      }
      navigate("/admin/support-tickets");
    } catch (err) {
      console.error("Support ticket delete failed:", err);
      alert(err?.message || "Unable to delete support ticket");
    }
  };

  if (loading) return <AdminLayout>Loading...</AdminLayout>;
  if (!item) return <AdminLayout>Support ticket not found.</AdminLayout>;

  const attachmentLink = item.invoiceUrl || "";

  return (
    <AdminLayout>
      <div className="mb-5">
        <button onClick={() => navigate(-1)} className="text-sm underline">
          Back
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Support Ticket Detail</h1>
          <p className="text-sm text-gray-500">
            {typeLabel(item.ticketType)} submitted on {parseDate(item.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Ticket Type</p>
            <p className="font-medium">{typeLabel(item.ticketType)}</p>
          </div>
          <div>
            <p className="text-gray-500">Current Status</p>
            <p className="font-medium capitalize">{String(item.status || "pending").replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-gray-500">Name</p>
            <p className="font-medium">{item.name || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium">{item.phone || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{item.email || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium">{item.productTypeName || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Product Name</p>
            <p className="font-medium">{item.modelName || item.productName || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Product ID</p>
            <p className="font-medium">{item.modelId || item.productId || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Purchase Date</p>
            <p className="font-medium">{item.purchaseDate || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Pincode</p>
            <p className="font-medium">{item.pincode || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">State</p>
            <p className="font-medium">{item.state || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">City</p>
            <p className="font-medium">{item.city || "-"}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Ticket Subject</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
            {item.issueSummary || "-"}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Issue Details</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm whitespace-pre-wrap">
            {item.issueDetails || "-"}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Attachment</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
            {attachmentLink ? (
              <a
                href={attachmentLink}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-600 underline"
              >
                {item.invoiceName || "Open uploaded file"}
              </a>
            ) : (
              "No attachment uploaded."
            )}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Admin Note</p>
          <textarea
            rows="4"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none"
            placeholder="Add your internal review note..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={item.status || "pending"}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={statusUpdating}
            className="h-10 px-3 text-sm border rounded-lg bg-white focus:outline-none"
          >
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>

          <button
            onClick={() => updateStatus(item.status || "pending")}
            disabled={statusUpdating}
            className="h-10 px-4 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {statusUpdating ? "Saving..." : "Save Status + Note"}
          </button>

          <button
            onClick={deleteItem}
            className="h-10 px-4 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Delete Ticket
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SupportTicketDetail;
