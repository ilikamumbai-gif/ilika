import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";

const NotificationDetail = () => {
    const { productId } = useParams(); // ✅ FIXED
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/notify/${productId}`
            );

            const d = await res.json();

            // safety check
            if (!d || !d.users) {
                setData({ productName: "", count: 0, users: [] });
            } else {
                setData(d);
            }
        } catch (err) {
            console.error(err);
            setData({ productName: "", count: 0, users: [] });
        }

        setLoading(false);
    };

    useEffect(() => {
        if (productId) fetchData();
    }, [productId]);

    if (loading) {
        return <AdminLayout>Loading...</AdminLayout>;
    }

    return (
        <AdminLayout>
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-sm underline"
            >
                ← Back
            </button>

            <div className="bg-white p-6 rounded-xl border space-y-6">
                <div>
                    <h1 className="text-xl font-bold">
                        {data.productName || "Product"}
                    </h1>

                    <p className="text-sm text-gray-500">
                        {data.count || 0} users requested notification
                    </p>
                </div>

                {/* USERS TABLE */}
                <div className="border rounded-xl overflow-hidden">
                    {data.users.length === 0 ? (
                        <div className="p-6 text-center text-gray-400">
                            No users found
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.users.map((u) => (
                                    <tr key={u.id} className="border-b">
                                        <td className="px-4 py-3">
                                            {u.userId || "Guest"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {u.email || "-"}
                                        </td>

                                        <td className="px-4 py-3">
                                            {u.createdAt
                                                ? new Date(
                                                    u.createdAt._seconds
                                                        ? u.createdAt._seconds * 1000
                                                        : u.createdAt
                                                ).toLocaleString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default NotificationDetail;