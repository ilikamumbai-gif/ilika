import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";

const AdminLog = () => {

  const [logs, setLogs] = useState([]);

  const API = import.meta.env.VITE_API_URL;

  const fetchLogs = async () => {

    const res = await fetch(`${API}/api/admin-log`);
    const data = await res.json();

    setLogs(data);

  };

  useEffect(() => {
    fetchLogs();
  }, []);


  /* ================= DATE FORMAT ================= */
const formatDate = (timestamp) => {

  if (!timestamp) return "-";

  let date;

  if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();

  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return `${day} ${month} ${year}    •      ${time}`;
};


  /* ================= TABLE COLUMNS ================= */

  const columns = [

    {
      label: "Admin",
      key: "admin",
      render: (row) => (
        <span className="font-medium">
          {row.admin || "Admin"}
        </span>
      )
    },

   
    {
      label: "Message",
      key: "message",
      render: (row) => (
        <span className="text-blue-700 font-semibold text-md">
          {row.message}
        </span>
      )
    },

    {
      label: "Date & Time",
      key: "createdAt",
      render: (row) => formatDate(row.createdAt)
    }

  ];


  return (

    <AdminLayout>

      <h1 className="text-xl font-semibold mb-6">
        Admin Activity Log
      </h1>

      <AdminTable
        columns={columns}
        data={logs}
        emptyText="No activity recorded yet"
      />

    </AdminLayout>

  );

};

export default AdminLog;