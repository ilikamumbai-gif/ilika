import { createContext, useContext, useState, useEffect } from "react";

// Dummy data, you can replace with API fetch
const AdminStatsContext = createContext(null);

export const AdminStatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0,
    ordersByMonth: [], // For chart
  });

  useEffect(() => {
    // Simulate API call
    const fetchStats = () => {
      setStats({
        totalProducts: 128,
        totalOrders: 542,
        totalUsers: 1204,
        revenue: 320000,
        ordersByMonth: [
          { month: "Jan", orders: 50 },
          { month: "Feb", orders: 75 },
          { month: "Mar", orders: 100 },
          { month: "Apr", orders: 120 },
          { month: "May", orders: 200 },
          { month: "Jun", orders: 150 },
        ],
      });
    };

    fetchStats();
  }, []);

  return (
    <AdminStatsContext.Provider value={{ stats }}>
      {children}
    </AdminStatsContext.Provider>
  );
};

export const useAdminStats = () => {
  const ctx = useContext(AdminStatsContext);
  if (!ctx) throw new Error("useAdminStats must be used inside AdminStatsProvider");
  return ctx;
};
