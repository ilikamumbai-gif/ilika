import React from "react";
import {
  Package, Users, ShoppingCart, IndianRupee,
  BookOpen, Layers, Boxes, Eye, Star, Shield,
  TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight
} from "lucide-react";
import StatCard from "../components/StatCard";
import AdminLayout from "../components/AdminLayout";
import { useOrders } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import { useUsers } from "../context/UserContext";
import { useBlog } from "../context/BlogProvider";
import { useCategories } from "../context/CategoryContext";
import { useCombos } from "../context/ComboContext";
import { useCartEvents } from "../context/CartEventContext";
import { useReviews } from "../context/ReviewContext";
import { useNavigate } from "react-router-dom";
import { normalizeSource } from "../Utils/trafficSource";

const STATUS_COLORS = {
  Placed:    "bg-blue-100 text-blue-700",
  Shipped:   "bg-purple-100 text-purple-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const SectionHeader = ({ title, linkTo, navigate }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h2>
    {linkTo && (
      <button
        onClick={() => navigate(linkTo)}
        className="flex items-center gap-1 text-xs font-semibold text-pink-600 hover:text-pink-700 transition"
      >
        View all <ArrowRight size={12} />
      </button>
    )}
  </div>
);

const Dashboard = () => {
  const { orders } = useOrders();
  const { products } = useProducts();
  const { users } = useUsers();
  const { blogs } = useBlog();
  const { categories } = useCategories();
  const { combos } = useCombos();
  const { events } = useCartEvents();
  const { reviews } = useReviews();
  const navigate = useNavigate();

  const totalRevenue = orders.reduce((a, o) => a + (o.total || 0), 0);
  const paidOrders   = orders.filter(o => o.paymentStatus === "Paid").length;
  const pendingOrders = orders.filter(o => o.status === "Placed").length;

  // Source breakdown
  const sourceCounts = orders.reduce((acc, o) => {
    const src = normalizeSource(o.source);
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  const sourceTotal = orders.length || 1;

  const SOURCE_BAR_COLORS = {
    "Facebook":    "#1877F2",
    "FB Ads":      "#0D5DBF",
    "Instagram":   "#E1306C",
    "Insta Ads":   "#A8174A",
    "Google":      "#FBBC04",
    "Google Ads":  "#EA8600",
    "Website":     "#6B7280",
  };

  // Recent 5 orders
  const recentOrders = [...orders].slice(0, 5);

  // Status breakdown
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout>
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your store overview at a glance</p>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div onClick={() => navigate("/admin/orders")} className="cursor-pointer">
          <StatCard title="Total Revenue" value={totalRevenue} icon={IndianRupee} color="bg-pink-100" textColor="text-pink-600" />
        </div>
        <div onClick={() => navigate("/admin/orders")} className="cursor-pointer">
          <StatCard title="Total Orders" value={orders.length} icon={ShoppingCart} color="bg-purple-100" textColor="text-purple-600" />
        </div>
        <div onClick={() => navigate("/admin/users")} className="cursor-pointer">
          <StatCard title="Total Users" value={users.length} icon={Users} color="bg-blue-100" textColor="text-blue-600" />
        </div>
        <div onClick={() => navigate("/admin/products")} className="cursor-pointer">
          <StatCard title="Products" value={products.length} icon={Package} color="bg-orange-100" textColor="text-orange-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div onClick={() => navigate("/admin/orders")} className="cursor-pointer">
          <StatCard title="Pending Orders" value={pendingOrders} icon={Clock} color="bg-yellow-100" textColor="text-yellow-600" />
        </div>
        <div onClick={() => navigate("/admin/combos")} className="cursor-pointer">
          <StatCard title="Combos" value={combos.length} icon={Boxes} color="bg-teal-100" textColor="text-teal-600" />
        </div>
        <div onClick={() => navigate("/admin/cart-products")} className="cursor-pointer">
          <StatCard title="Cart Interest" value={events.length} icon={Eye} color="bg-indigo-100" textColor="text-indigo-600" />
        </div>
        <div onClick={() => navigate("/admin/reviews")} className="cursor-pointer">
          <StatCard title="Reviews" value={reviews.length} icon={Star} color="bg-amber-100" textColor="text-amber-600" />
        </div>
      </div>

      {/* ── BOTTOM GRID ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ border: "1px solid #EBEBEB" }}>
          <SectionHeader title="Recent Orders" linkTo="/admin/orders" navigate={navigate} />
          <div className="space-y-0">
            {recentOrders.length === 0 && (
              <p className="text-sm text-gray-300 py-6 text-center">No orders yet</p>
            )}
            {recentOrders.map((order, i) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-xl transition"
                style={{ borderBottom: i < recentOrders.length - 1 ? "1px solid #F5F5F5" : "none" }}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center shrink-0">
                    <ShoppingCart size={14} className="text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {order.shippingAddress?.name || order.userEmail}
                    </p>
                    <p className="text-xs text-gray-400 truncate">#{order.id.slice(-8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-bold text-gray-800">₹{order.total?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #EBEBEB" }}>
            <SectionHeader title="Order Status" navigate={navigate} />
            <div className="space-y-3">
              {[
                { label: "Placed",    color: "#3B82F6", bg: "bg-blue-50"   },
                { label: "Shipped",   color: "#8B5CF6", bg: "bg-purple-50" },
                { label: "Delivered", color: "#10B981", bg: "bg-green-50"  },
                { label: "Cancelled", color: "#EF4444", bg: "bg-red-50"    },
              ].map(({ label, color, bg }) => {
                const count = statusCounts[label] || 0;
                const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0`} style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-600">{label}</span>
                        <span className="text-xs font-bold text-gray-800">{count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #EBEBEB" }}>
            <SectionHeader title="Traffic Sources" navigate={navigate} />
            <div className="space-y-2.5">
              {Object.entries(sourceCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([src, count]) => {
                  const pct = Math.round((count / sourceTotal) * 100);
                  const color = SOURCE_BAR_COLORS[src] || "#6B7280";
                  return (
                    <div key={src} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">{src}</span>
                          <span className="text-xs font-bold text-gray-800">{count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(sourceCounts).length === 0 && (
                <p className="text-xs text-gray-300 text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
