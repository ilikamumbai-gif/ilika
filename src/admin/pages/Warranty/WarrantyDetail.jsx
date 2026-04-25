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

const WarrantyDetail = () => {
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
      const res = await fetch(`${API}/api/warranty-registrations/${id}`);
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Warranty API route not found (backend not updated)." : data?.error || "Warranty request not found");
      }
      setItem(data);
      setNote(data?.verificationNote || "");
    } catch (err) {
      console.error("Warranty detail fetch error:", err);
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
      const res = await fetch(`${API}/api/warranty-registrations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, verificationNote: note }),
      });
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Warranty API route not found (backend not updated)." : data?.error || "Failed to update status");
      }
      setItem((prev) => ({ ...prev, status: nextStatus, verificationNote: note }));
    } catch (err) {
      console.error("Warranty status update failed:", err);
      alert(err?.message || "Unable to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const deleteItem = async () => {
    if (!window.confirm("Delete this warranty request?")) return;
    try {
      const res = await fetch(`${API}/api/warranty-registrations/${id}`, { method: "DELETE" });
      const { data, text } = await parseApiResponse(res);
      if (!res.ok) {
        const isHtmlError = typeof text === "string" && text.trim().startsWith("<!DOCTYPE");
        throw new Error(isHtmlError ? "Warranty API route not found (backend not updated)." : data?.error || "Delete failed");
      }
      navigate("/admin/warranty");
    } catch (err) {
      console.error("Warranty delete failed:", err);
      alert(err?.message || "Unable to delete warranty request");
    }
  };

  if (loading) return <AdminLayout>Loading...</AdminLayout>;
  if (!item) return <AdminLayout>Warranty request not found.</AdminLayout>;

  return (
    <AdminLayout>
      <div className="mb-5">
        <button onClick={() => navigate(-1)} className="text-sm underline">
          Back
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Warranty Request Detail</h1>
          <p className="text-sm text-gray-500">Submitted on {parseDate(item.createdAt)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
            <p className="text-gray-500">Address</p>
            <p className="font-medium">{item.address || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Product Name</p>
            <p className="font-medium">{item.productName || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Product ID</p>
            <p className="font-medium">{item.productId || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Purchase Date</p>
            <p className="font-medium">{item.purchaseDate || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">City</p>
            <p className="font-medium">{item.city || "-"}</p>
          </div>
          <div>
            <p className="text-gray-500">Current Status</p>
            <p className="font-medium capitalize">{String(item.status || "pending").replace("_", " ")}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Customer Address</p>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm whitespace-pre-wrap">
            {item.address || item.issue || "-"}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Verification Note (Admin)</p>
          <textarea
            rows="4"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none"
            placeholder="Add your verification note..."
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
            <option value="eligible">Eligible</option>
            <option value="not_eligible">Not Eligible</option>
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
            Delete Request
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default WarrantyDetail;
