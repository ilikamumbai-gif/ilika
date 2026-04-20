import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notify/${id}`);
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (!data) return <AdminLayout>Loading...</AdminLayout>;

  return (
    <AdminLayout>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm underline">
        ← Back
      </button>

      <div className="bg-white p-6 rounded-xl border space-y-4">
        <h1 className="text-lg font-bold">Notification Detail</h1>

        <div><strong>Product:</strong> {data.productName}</div>
        <div><strong>Product ID:</strong> {data.productId}</div>
        <div><strong>User ID:</strong> {data.userId || "Guest"}</div>
        <div><strong>Email:</strong> {data.email}</div>
        <div><strong>Status:</strong> {data.status}</div>
        <div>
          <strong>Date:</strong>{" "}
          {new Date(data.createdAt).toLocaleString()}
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationDetail;