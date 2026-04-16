import React, { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import RevenueReport from "./RevenueReport";
import TopCustomers from "./TopCustomers";
import TransferHistory from "./TransferHistory";
import { BarChart2, Users, ArrowLeftRight } from "lucide-react";

const TABS = [
  { id: "revenue",   label: "Revenue",         icon: BarChart2        },
  { id: "customers", label: "Top Customers",    icon: Users            },
  { id: "transfers", label: "Transfer History", icon: ArrowLeftRight   },
];

const Report = () => {
  const [tab, setTab] = useState("revenue");

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track revenue, top customers, and transfers</p>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-2xl p-1.5 inline-flex gap-1 mb-6" style={{ border: "1px solid #EBEBEB" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150
              ${tab === id ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            style={tab === id ? { background: "linear-gradient(135deg,#E91E8C,#FF6B35)" } : {}}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "revenue"   && <RevenueReport />}
      {tab === "customers" && <TopCustomers />}
      {tab === "transfers" && <TransferHistory />}
    </AdminLayout>
  );
};

export default Report;
