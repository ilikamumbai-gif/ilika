import React, { useState } from "react";
import AdminSidebar from "../components/AdminSildebar";
import AdminHeader from "../components/AdminHeader";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  return (
    <div className="flex min-h-screen" style={{ background: "#F7F7F8", fontFamily: "'DM Sans', sans-serif" }}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={() => setRefreshTick((prev) => prev + 1)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div key={refreshTick}>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
