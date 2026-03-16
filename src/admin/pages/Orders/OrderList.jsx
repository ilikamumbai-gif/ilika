import React, { useState } from "react";
import { Eye, Trash2, Search, SlidersHorizontal, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useOrders } from "../../context/OrderContext";
import { logActivity } from "../../Utils/logActivity";
import { normalizeSource } from "../../Utils/trafficSource";

const STATUS_STYLES = {
  Placed:    "bg-blue-50 text-blue-700 border border-blue-200",
  Shipped:   "bg-purple-50 text-purple-700 border border-purple-200",
  Delivered: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const SOURCE_STYLES = {
  "Facebook":    "bg-blue-50 text-blue-600 border border-blue-200",
  "FB Ads":      "bg-blue-100 text-blue-800 border border-blue-300",
  "Instagram":   "bg-pink-50 text-pink-600 border border-pink-200",
  "Insta Ads":   "bg-pink-100 text-pink-800 border border-pink-300",
  "Google":      "bg-yellow-50 text-yellow-700 border border-yellow-200",
  "Google Ads":  "bg-yellow-100 text-yellow-800 border border-yellow-300",
  "Website":     "bg-gray-100 text-gray-600 border border-gray-200",
};

const PAYMENT_STYLES = {
  "Paid":   "bg-green-50 text-green-700 border border-green-200",
  "Unpaid": "bg-orange-50 text-orange-700 border border-orange-200",
};

const Pill = ({ label, styleClass }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styleClass}`}>
    {label}
  </span>
);

const FilterSelect = ({ value, onChange, children, icon }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="h-9 pl-3 pr-8 text-sm border rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
      style={{ border: "1px solid #E0E0E0", color: "#444" }}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
      <svg width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
    </div>
  </div>
);

const OrderList = () => {
  const navigate = useNavigate();
  const { orders, loading, updateOrderStatus, deleteAllOrders, deleteOrder } = useOrders();

  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");

  const handleStatusChange = async (id, status) => {
    await updateOrderStatus(id, status);
    await logActivity(`Updated order #${id.slice(-6)} status → ${status}`);
  };

  const filteredOrders = orders.filter((o) => {
    const srcDisplay = normalizeSource(o.source);
    return (
      (!statusFilter  || o.status === statusFilter) &&
      (!sourceFilter  || srcDisplay === sourceFilter) &&
      (!paymentFilter || o.paymentStatus === paymentFilter) &&
      (!search        ||
        o.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        o.shippingAddress?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id?.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{orders.length} total orders</p>
        </div>
        <button
          onClick={() => { if (window.confirm("Delete ALL orders? This cannot be undone.")) { deleteAllOrders(); logActivity("Deleted all orders"); } }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
        >
          <Trash2 size={14} /> Delete All
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3 items-center" style={{ border: "1px solid #EBEBEB" }}>
        <SlidersHorizontal size={16} className="text-gray-400 shrink-0" />
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
            style={{ border: "1px solid #E0E0E0" }}
          />
        </div>

        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Placed</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </FilterSelect>

        <FilterSelect value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="">All Payments</option>
          <option>Paid</option>
          <option>Unpaid</option>
        </FilterSelect>

        <FilterSelect value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">All Sources</option>
          <option>Facebook</option>
          <option>FB Ads</option>
          <option>Instagram</option>
          <option>Insta Ads</option>
          <option>Google</option>
          <option>Google Ads</option>
          <option>Website</option>
        </FilterSelect>

        {(statusFilter || sourceFilter || paymentFilter || search) && (
          <button
            onClick={() => { setStatusFilter(""); setSourceFilter(""); setPaymentFilter(""); setSearch(""); }}
            className="text-xs text-pink-600 font-medium hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <Package size={40} className="mb-3" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                    {["Order ID", "Customer", "Items", "Total", "Payment", "Source", "Date", "Status", "Actions"].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const srcDisplay = normalizeSource(order.source);
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50/70 transition-colors"
                        style={{ borderBottom: "1px solid #F5F5F5" }}
                      >
                        {/* Order ID */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs font-semibold text-gray-500">
                            #{order.id.slice(-8)}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800 text-sm leading-tight">
                            {order.shippingAddress?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{order.userEmail}</p>
                          {order.shippingAddress?.phone && (
                            <p className="text-xs text-gray-400">{order.shippingAddress.phone}</p>
                          )}
                        </td>

                        {/* Items count */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">{order.items?.length || 0} items</span>
                        </td>

                        {/* Total */}
                        <td className="px-5 py-4">
                          <span className="font-bold text-gray-900">₹{order.total?.toLocaleString("en-IN")}</span>
                        </td>

                        {/* Payment */}
                        <td className="px-5 py-4">
                          <Pill
                            label={order.paymentStatus || "Unpaid"}
                            styleClass={PAYMENT_STYLES[order.paymentStatus] || PAYMENT_STYLES["Unpaid"]}
                          />
                        </td>

                        {/* Source */}
                        <td className="px-5 py-4">
                          <Pill label={srcDisplay} styleClass={SOURCE_STYLES[srcDisplay] || SOURCE_STYLES["Website"]} />
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">{order.date}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-300 ${STATUS_STYLES[order.status] || ""}`}
                          >
                            <option>Placed</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm("Delete this order?")) {
                                  await deleteOrder(order.id);
                                  await logActivity(`Deleted order #${order.id.slice(-6)}`);
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const srcDisplay = normalizeSource(order.source);
                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{order.shippingAddress?.name || "—"}</p>
                        <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-8)}</p>
                      </div>
                      <span className="font-bold text-gray-900">₹{order.total?.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Pill label={order.status} styleClass={STATUS_STYLES[order.status] || ""} />
                      <Pill label={order.paymentStatus || "Unpaid"} styleClass={PAYMENT_STYLES[order.paymentStatus] || PAYMENT_STYLES["Unpaid"]} />
                      <Pill label={srcDisplay} styleClass={SOURCE_STYLES[srcDisplay] || ""} />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="flex-1 h-8 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                        View Details
                      </button>
                      <button onClick={async () => { if (window.confirm("Delete?")) { await deleteOrder(order.id); } }}
                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Summary footer */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-400">
          <span>Showing <strong className="text-gray-600">{filteredOrders.length}</strong> of <strong className="text-gray-600">{orders.length}</strong> orders</span>
          <span>Total: <strong className="text-gray-800">₹{filteredOrders.reduce((a, o) => a + (o.total || 0), 0).toLocaleString("en-IN")}</strong></span>
        </div>
      )}
    </AdminLayout>
  );
};

export default OrderList;
