import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  Clock,
  IndianRupee,
  Mail,
  MousePointerClick,
  Phone,
  ShoppingBag,
  UserRoundSearch,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";
import { useCartEvents } from "../../context/CartEventContext";
import { formatOrderRef } from "../../../utils/orderId";
import { getApiUrl } from "../../../utils/api";
import {
  buildUserConnectionSummary,
  getRecordDisplayEmail,
  getRecordDisplayPhone,
} from "../../Utils/customerConnections";
import { getOrderDisplayItemCount, getOrderSellingTotal } from "../../../utils/orderPricing";

const STATUS_STYLES = {
  Placed: "bg-blue-50 text-blue-700 border border-blue-200",
  Shipped: "bg-purple-50 text-purple-700 border border-purple-200",
  Delivered: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  if (value?._seconds) return new Date(value._seconds * 1000).toLocaleString("en-IN");
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString("en-IN");
};

const UserDetailConnected = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users } = useUsers();
  const { orders } = useOrders();
  const { events } = useCartEvents();
  const [leads, setLeads] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const user = users.find((entry) => String(entry.id) === String(id));

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const [leadsRes, notificationsRes] = await Promise.all([
          fetch(getApiUrl("/api/leads")).catch(() => null),
          fetch(getApiUrl("/api/notify-requests")).catch(() => null),
        ]);

        const nextLeads = leadsRes?.ok ? await leadsRes.json() : [];
        const nextNotifications = notificationsRes?.ok ? await notificationsRes.json() : [];

        setLeads(Array.isArray(nextLeads) ? nextLeads : []);
        setNotifications(Array.isArray(nextNotifications) ? nextNotifications : []);
      } catch (error) {
        console.error("Failed to fetch user detail connections", error);
        setLeads([]);
        setNotifications([]);
      }
    };

    loadConnections();
  }, []);

  const summary = useMemo(
    () =>
      user
        ? buildUserConnectionSummary({
            user,
            orders,
            cartEvents: events,
            leads,
            notifications,
          })
        : { orders: [], cartEvents: [], leads: [], notifications: [], totalSpent: 0 },
    [events, leads, notifications, orders, user]
  );

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-300">
          <p className="text-lg">User not found</p>
          <button onClick={() => navigate(-1)} className="text-sm text-pink-600 underline">
            Back
          </button>
        </div>
      </AdminLayout>
    );
  }

  const userOrders = summary.orders;
  const deliveredCount = userOrders.filter((order) => order.status === "Delivered").length;
  const pendingCount = userOrders.filter((order) => order.status === "Placed").length;
  const recentCartEvents = summary.cartEvents.slice(0, 5);
  const recentLeads = summary.leads.slice(0, 5);
  const recentNotifications = summary.notifications.slice(0, 5);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-xl border border-gray-200 p-2 transition hover:bg-gray-50">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Profile</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #EBEBEB" }}>
          <div className="mb-5 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white"
              style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}
            >
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.name || "-"}</h2>
            <span className={`mt-2 rounded-full border px-3 py-1 text-xs font-medium ${userOrders.length > 0 || summary.cartEvents.length > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-gray-200 bg-gray-100 text-gray-500"}`}>
              {userOrders.length > 0 || summary.cartEvents.length > 0 ? "Connected Customer" : "Inactive"}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-gray-600">
              <Mail size={14} className="shrink-0 text-gray-400" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2.5 text-gray-600">
                <Phone size={14} className="shrink-0 text-gray-400" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-xs text-gray-500">
              <Clock size={14} className="shrink-0 text-gray-400" />
              <span>UID: ...{(user.uid || user.id || "").slice(-12)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2 xl:grid-cols-4">
          {[
            { label: "Total Orders", value: userOrders.length, icon: ShoppingBag, color: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Total Spent", value: `₹${summary.totalSpent.toLocaleString("en-IN")}`, icon: IndianRupee, color: "bg-pink-50", iconColor: "text-pink-600" },
            { label: "Delivered", value: deliveredCount, icon: CheckCircle, color: "bg-green-50", iconColor: "text-green-600" },
            { label: "Pending Orders", value: pendingCount, icon: Clock, color: "bg-gray-50", iconColor: "text-gray-600" },
            { label: "Cart Events", value: summary.cartEvents.length, icon: MousePointerClick, color: "bg-orange-50", iconColor: "text-orange-600" },
            { label: "Leads", value: summary.leads.length, icon: UserRoundSearch, color: "bg-violet-50", iconColor: "text-violet-600" },
            { label: "Notifications", value: summary.notifications.length, icon: Bell, color: "bg-amber-50", iconColor: "text-amber-600" },
          ].map(({ label, value, icon: Icon, color, iconColor }) => (
            <div key={label} className={`${color} flex items-center justify-between rounded-2xl p-5`} style={{ border: "1px solid #EBEBEB" }}>
              <div>
                <p className="mb-1 text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                <Icon size={18} className={iconColor} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#EBEBEB" }}>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Recent Cart Interest</h3>
          {recentCartEvents.length === 0 ? (
            <p className="text-sm text-gray-400">No cart activity found.</p>
          ) : (
            <div className="space-y-3">
              {recentCartEvents.map((event) => (
                <div key={event.id} className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">{event.name || "Product"}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(event.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#EBEBEB" }}>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Lead Activity</h3>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-gray-400">No lead records matched this user.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">{lead.offerName || "Offer lead"}</p>
                  <p className="text-xs text-gray-500">{getRecordDisplayPhone(lead)} • {lead.status || "new"}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#EBEBEB" }}>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Back In Stock Requests</h3>
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-gray-400">No notification requests matched this user.</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-sm font-semibold text-gray-800">{notification.productName || "Product"}</p>
                  <p className="text-xs text-gray-500">{getRecordDisplayEmail(notification)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid #EBEBEB" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #F0F0F0", background: "#FAFAFA" }}>
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "#888" }}>
            Order History ({userOrders.length})
          </h3>
        </div>
        {userOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <ShoppingBag size={36} className="mb-2" />
            <p className="text-sm">No orders placed yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #F0F0F0" }}>
                  {["Order ID", "Date", "Items", "Total", "Payment", "Status", "Action"].map((heading) => (
                    <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-gray-50/70" style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">#{formatOrderRef(order.id)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{order.date}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{getOrderDisplayItemCount(order)}</td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">₹{getOrderSellingTotal(order).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${order.paymentStatus === "Paid" ? "border-green-200 bg-green-50 text-green-700" : "border-orange-200 bg-orange-50 text-orange-700"}`}>
                        {order.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-500"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="text-xs font-semibold text-pink-600 hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserDetailConnected;
