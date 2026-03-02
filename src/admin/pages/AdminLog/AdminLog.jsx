import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";

const AdminLog = () => {

    const [logs, setLogs] = useState([]);

    const API = import.meta.env.VITE_API_URL;

    const fetchLogs = async () => {

        const res = await fetch(
            `${API}/api/admin-log`
        );

        const data = await res.json();

        setLogs(data);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (

        <AdminLayout>

            <h1>Admin Activity</h1>

            <div>

                {logs.map(l => (

                    <div key={l.id}
                        className="border p-3 mb-2">

                        <p>{l.message}</p>

                        <p className="text-sm text-gray-500">

                            {l.createdAt?._seconds
                                ? new Date(
                                    l.createdAt._seconds * 1000
                                ).toLocaleString()
                                : ""}

                        </p>

                    </div>

                ))}

            </div>

        </AdminLayout>
    );
};

export default AdminLog;