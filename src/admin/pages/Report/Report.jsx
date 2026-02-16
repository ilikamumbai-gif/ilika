import React, { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import RevenueReport from "./RevenueReport";
import TopCustomers from "./TopCustomers";
import TransferHistory from "./TransferHistory";

const Report = () => {

  const [tab, setTab] = useState("revenue");

  const tabs = [
    { id: "revenue", label: "Revenue" },
    { id: "customers", label: "Top Customers" },
    { id: "transfers", label: "Transfer History" },
  ];

  return (
    <AdminLayout>

      <h1 className="text-2xl font-semibold mb-6">Reports & Analytics</h1>

      {/* TAB SWITCHER */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${tab === t.id
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {tab === "revenue" && <RevenueReport />}
      {tab === "customers" && <TopCustomers />}
      {tab === "transfers" && <TransferHistory />}

    </AdminLayout>
  );
};

export default Report;