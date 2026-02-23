import React from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useOrders } from "../../context/OrderContext";

const getStatusStyle = (status) => {
  switch (status) {
    case "Placed":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "Shipped":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Delivered":
      return "bg-green-100 text-green-700 border-green-300";
    case "Cancelled":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};


const OrderList = () => {
  const navigate = useNavigate();
  const { orders, loading, updateOrderStatus } = useOrders();

  const handleStatusChange = (id, status) => {
    updateOrderStatus(id, status);
  };
const normalizeSource = (src) => {
  if (!src) return "WEBSITE";

  const s = src.toLowerCase();

  if (
    s.includes("meta") ||
    s.includes("facebook") ||
    s.includes("instagram") ||
    s.includes("fbclid")
  )
    return "META ADS";

  if (
    s.includes("google") ||
    s.includes("gclid") ||
    s.includes("search")
  )
    return "GOOGLE ADS";

  return "WEBSITE";
};
  const columns = [
    {
      label: "Order ID",
      key: "id",
      render: (row) => (
        <span className="font-medium text-gray-700">
          #{row?.id?.slice(-6)}
        </span>
      ),
    },

    {
      label: "Customer",
      key: "userEmail",
      render: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-800">
            {row?.shippingAddress?.name || "Customer"}
          </p>
          <p className="text-gray-500">{row?.userEmail}</p>
        </div>
      ),
    },

    {
      label: "Payment",
      key: "paymentMethod",
      render: (row) => (
        <span className="text-sm font-medium">
          {row?.paymentStatus === "Paid" ? "ONLINE" : "COD"}
        </span>
      ),
    },
  {
  label: "Source",
  key: "source",
  render: (row) => {
    const src = normalizeSource(row?.source);

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full font-medium
        ${src === "META ADS"
            ? "bg-blue-100 text-blue-700"
            : src === "GOOGLE ADS"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"}`}
      >
        {src}
      </span>
    );
  }
},

    {
      label: "Total",
      key: "total",
      align: "right",
      render: (row) => `₹${row?.total || 0}`,
    },

    {
      label: "Status",
      key: "status",
      render: (row) => (
        <select
          value={row?.status || "Placed"}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className={`border rounded-md text-xs px-2 py-1 font-medium focus:outline-none ${getStatusStyle(row?.status || "Placed")}`}
        >

          <option value="Placed">Placed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      ),
    },

    { label: "Date", key: "date" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-xl font-semibold mb-4">Orders</h1>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <AdminTable
          columns={columns}
          data={orders}
          actions={(row) => (
            <button
              onClick={() => navigate(`/admin/orders/${row.id}`)}
              className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              <Eye size={16} />
            </button>
          )}
          emptyText="No orders found"
        />
      )}
    </AdminLayout>
  );
};

export default OrderList;
