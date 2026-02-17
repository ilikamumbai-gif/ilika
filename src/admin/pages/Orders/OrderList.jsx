import React from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import AdminTable from "../../components/AdminTable";
import { useOrders } from "../../context/OrderContext";

const OrderList = () => {
  const navigate = useNavigate();
  const { orders, loading } = useOrders();

  const columns = [
    {
      label: "Order ID",
      key: "id",
      render: (row) => (
        <span className="font-medium text-gray-700">
          #{row?.id ? row.id.slice(-6) : "------"}
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
      label: "Total",
      key: "total",
      align: "right",
      render: (row) => `₹${row?.total || 0}`,
    },

    {
      label: "Status",
      key: "status",
      render: (row) => {
        const status = row?.status || "Placed";

        const color =
          status === "Delivered"
            ? "bg-green-100 text-green-700"
            : status === "Shipped"
            ? "bg-blue-100 text-blue-700"
            : status === "Cancelled"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {status}
          </span>
        );
      },
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
