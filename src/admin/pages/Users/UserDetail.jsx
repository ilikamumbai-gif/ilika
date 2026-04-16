import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, ShoppingBag, IndianRupee, CheckCircle, Clock } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";

const STATUS_STYLES = {
  Placed:    "bg-blue-50 text-blue-700 border border-blue-200",
  Shipped:   "bg-purple-50 text-purple-700 border border-purple-200",
  Delivered: "bg-green-50 text-green-700 border border-green-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users } = useUsers();
  const { orders } = useOrders();

  const user = users.find(u => String(u.id) === String(id));
  const userOrders = orders.filter(o => String(o.userId) === String(user?.uid || user?.id) || String(o.userEmail) === String(user?.email));

  const totalSpent    = userOrders.reduce((a, o) => a + (o.total || 0), 0);
  const deliveredCount = userOrders.filter(o => o.status === "Delivered").length;

  if (!user) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 text-gray-300 gap-3">
          <p className="text-lg">User not found</p>
          <button onClick={() => navigate(-1)} className="text-sm text-pink-600 underline">← Go back</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Top */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Profile</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Profile card */}
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #EBEBEB" }}>
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black mb-3"
              style={{ background: "linear-gradient(135deg,#E91E8C,#FF6B35)" }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.name || "—"}</h2>
            <span className={`mt-2 text-xs px-3 py-1 rounded-full font-medium border ${userOrders.length > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
              {userOrders.length > 0 ? "Active Customer" : "Inactive"}
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-gray-600">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2.5 text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-gray-500 text-xs">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <span>UID: …{(user.uid || user.id)?.slice(-12)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: "Total Orders",     value: userOrders.length,                              icon: ShoppingBag,  color: "bg-blue-50",   iconColor: "text-blue-600"   },
            { label: "Total Spent",      value: `₹${totalSpent.toLocaleString("en-IN")}`,       icon: IndianRupee,  color: "bg-pink-50",   iconColor: "text-pink-600"   },
            { label: "Delivered",        value: deliveredCount,                                  icon: CheckCircle,  color: "bg-green-50",  iconColor: "text-green-600"  },
            { label: "Pending Orders",   value: userOrders.filter(o => o.status === "Placed").length, icon: Clock, color: "bg-orange-50", iconColor: "text-orange-600" },
          ].map(({ label, value, icon: Icon, color, iconColor }) => (
            <div key={label} className={`${color} rounded-2xl p-5 flex items-center justify-between`} style={{ border: "1px solid #EBEBEB" }}>
              <div>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Icon size={18} className={iconColor} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
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
                  {["Order ID", "Date", "Items", "Total", "Payment", "Status", "Action"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#888" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors" style={{ borderBottom: "1px solid #F5F5F5" }}>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">#{order.id.slice(-8)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{order.date}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{order.items?.length || 0}</td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">₹{order.total?.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${order.paymentStatus === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                        {order.paymentStatus || "Unpaid"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-500"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="text-xs text-pink-600 font-semibold hover:underline">
                        View →
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

export default UserDetail;
