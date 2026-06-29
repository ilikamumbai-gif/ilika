import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { useCartEvents } from "../../context/CartEventContext";
import { useUsers } from "../../context/UserContext";
import { useOrders } from "../../context/OrderContext";
import {
  findMatchedUser,
  getRecordDisplayEmail,
  getRecordDisplayName,
  getRecordDisplayPhone,
} from "../../Utils/customerConnections";

const formatDate = (date) => {
  if (!date) return "-";
  if (date?._seconds) return new Date(date._seconds * 1000).toLocaleString("en-IN");
  return new Date(date).toLocaleString("en-IN");
};

const formatAddress = (address = {}) => {
  const parts = [
    address.addressLine || address.line,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  return parts.join(", ") || "-";
};

const CartProductDetailConnected = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { events } = useCartEvents();
  const { users } = useUsers();
  const { orders } = useOrders();

  const filtered = events.filter(
    (event) => String(event.productId || "") === String(productId || "")
  );

  if (filtered.length === 0) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-400">
          No cart activity found for this product.
        </div>
      </AdminLayout>
    );
  }

  const product = filtered[0];

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-pink-600 hover:underline">
          Back
        </button>

        <h1 className="mb-6 text-xl font-semibold text-gray-900">Product Interest Details</h1>

        <div className="mb-6 flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
          {product.image ? (
            <img loading="lazy" src={product.image} alt={product.name} className="h-24 w-24 rounded-xl object-cover" />
          ) : (
            <div className="grid h-24 w-24 place-content-center rounded-xl bg-gray-100 text-sm text-gray-400">
              No image
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="mt-1 font-bold text-gray-900">₹{product.price}</p>
            <p className="mt-2 text-sm text-gray-500">
              Total Events: <b>{filtered.length}</b>
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Latest Order</th>
                <th className="p-3 text-left">Address</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => {
                const matchedUser = findMatchedUser(users, event);
                const matchedOrders = orders
                  .filter((order) => {
                    if (matchedUser) {
                      return String(order.userId || "") === String(matchedUser.id || matchedUser.uid || "") || String(order.userEmail || "").toLowerCase() === String(matchedUser.email || "").toLowerCase();
                    }
                    return String(order.userEmail || "").toLowerCase() === String(event.userEmail || "").toLowerCase();
                  })
                  .sort((a, b) => new Date(b.createdAt?._seconds ? b.createdAt._seconds * 1000 : b.createdAt || 0) - new Date(a.createdAt?._seconds ? a.createdAt._seconds * 1000 : a.createdAt || 0));
                const latestOrder = matchedOrders[0] || null;

                return (
                  <tr key={event.id} className="border-b last:border-b-0">
                    <td className="p-3">
                      {matchedUser ? (
                        <button onClick={() => navigate(`/admin/users/${matchedUser.id}`)} className="font-semibold text-pink-600 hover:underline">
                          {matchedUser.name || "Registered User"}
                        </button>
                      ) : (
                        <span className="font-semibold text-gray-800">{getRecordDisplayName(event)}</span>
                      )}
                    </td>
                    <td className="p-3">{matchedUser?.email || getRecordDisplayEmail(event)}</td>
                    <td className="p-3">{matchedUser?.phone || getRecordDisplayPhone(latestOrder) || "-"}</td>
                    <td className="p-3">
                      {latestOrder ? (
                        <button onClick={() => navigate(`/admin/orders/${latestOrder.id}`)} className="text-pink-600 hover:underline">
                          #{latestOrder.id?.slice(-8)}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-600">{formatAddress(latestOrder?.shippingAddress)}</td>
                    <td className="p-3">{formatDate(event.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CartProductDetailConnected;
